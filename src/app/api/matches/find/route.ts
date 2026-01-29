import { NextRequest, NextResponse } from 'next/server';
import { sql, User } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const currentUserResult = await sql`
        SELECT * FROM users WHERE id = ${userId}
      `;

      if (currentUserResult.rows.length === 0) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const currentUser = currentUserResult.rows[0] as User;

      const existingMatchesResult = await sql`
        SELECT user1_id, user2_id FROM matches
        WHERE user1_id = ${userId} OR user2_id = ${userId}
      `;

      const matchedUserIds = new Set<string>();
      matchedUserIds.add(userId);
      existingMatchesResult.rows.forEach((m) => {
        matchedUserIds.add(m.user1_id);
        matchedUserIds.add(m.user2_id);
      });

      const matchedIdsArray = Array.from(matchedUserIds);

      const potentialMatchesResult = await sql`
        SELECT * FROM users
        WHERE id != ALL(${matchedIdsArray as unknown as string}::uuid[])
        LIMIT 20
      `;

      if (potentialMatchesResult.rows.length === 0) {
        return NextResponse.json({ matches: [], message: 'No potential matches found' });
      }

      const createdMatches = [];

      for (const candidate of potentialMatchesResult.rows as User[]) {
        const score = calculateCompatibility(currentUser, candidate);

        if (score >= 30) {
          const [user1_id, user2_id] =
            currentUser.id < candidate.id
              ? [currentUser.id, candidate.id]
              : [candidate.id, currentUser.id];

          const matchResult = await sql`
            INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
            VALUES (${user1_id}, ${user2_id}, ${score}, 'matched')
            ON CONFLICT (user1_id, user2_id) DO NOTHING
            RETURNING *
          `;

          if (matchResult.rows.length > 0) {
            createdMatches.push({
              match: matchResult.rows[0],
              partner: sanitizePartner(candidate),
              compatibility_score: score,
            });
          }
        }
      }

      return NextResponse.json({ matches: createdMatches });
    } catch (error) {
      console.error('Match find error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

function calculateCompatibility(user1: User, user2: User): number {
  const style1 = new Set(user1.playing_style || []);
  const style2 = new Set(user2.playing_style || []);
  const interests1 = new Set(user1.interests || []);
  const interests2 = new Set(user2.interests || []);

  const styleScore = jaccardSimilarity(style1, style2);
  const interestScore = jaccardSimilarity(interests1, interests2);

  const totalScore = (styleScore * 0.4 + interestScore * 0.6) * 100;
  return Math.round(totalScore * 100) / 100;
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0.5;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function sanitizePartner(user: User) {
  return {
    id: user.id,
    display_name: user.display_name,
    playing_style: user.playing_style,
    interests: user.interests,
    bio: user.bio,
  };
}
