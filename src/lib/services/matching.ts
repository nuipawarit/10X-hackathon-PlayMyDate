import { sql } from '@/lib/db';
import type { User } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface MatchWithPartner {
  id: string;
  compatibilityScore: number;
  status: string;
  createdAt: string;
  partner: SanitizedPartner;
}

export interface SanitizedPartner {
  id: string;
  display_name: string | null;
  playing_style: string[];
  interests: string[];
  bio: string | null;
}

export interface CreatedMatch {
  match: {
    id: string;
    user1_id: string;
    user2_id: string;
    compatibility_score: number;
    status: string;
  };
  partner: SanitizedPartner;
  compatibility_score: number;
}

export function calculateCompatibility(user1: User, user2: User): number {
  const style1 = new Set(user1.playing_style || []);
  const style2 = new Set(user2.playing_style || []);
  const interests1 = new Set(user1.interests || []);
  const interests2 = new Set(user2.interests || []);

  const styleScore = jaccardSimilarity(style1, style2);
  const interestScore = jaccardSimilarity(interests1, interests2);

  const totalScore = (styleScore * 0.4 + interestScore * 0.6) * 100;
  return Math.round(totalScore * 100) / 100;
}

export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0.5;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

export function sanitizePartner(user: User): SanitizedPartner {
  return {
    id: user.id,
    display_name: user.display_name,
    playing_style: user.playing_style || [],
    interests: user.interests || [],
    bio: user.bio,
  };
}

export async function findMatches(userId: string): Promise<ServiceResult<CreatedMatch[]>> {
  try {
    const currentUserResult = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (currentUserResult.rows.length === 0) {
      return failure('Profile not found', 'NOT_FOUND');
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
      return success([]);
    }

    const createdMatches: CreatedMatch[] = [];

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
          const match = matchResult.rows[0] as {
            id: string;
            user1_id: string;
            user2_id: string;
            compatibility_score: number;
            status: string;
          };
          createdMatches.push({
            match,
            partner: sanitizePartner(candidate),
            compatibility_score: score,
          });
        }
      }
    }

    return success(createdMatches);
  } catch (error) {
    console.error('findMatches error:', error);
    return failure('Failed to find matches', 'INTERNAL_ERROR');
  }
}

export async function unmatch(userId: string, matchId: string): Promise<ServiceResult<void>> {
  try {
    const result = await sql`
      UPDATE matches
      SET status = 'unmatched', updated_at = NOW()
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    return success(undefined);
  } catch (error) {
    console.error('unmatch error:', error);
    return failure('Failed to unmatch', 'INTERNAL_ERROR');
  }
}
