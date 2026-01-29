import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const secretKey = request.headers.get('x-seed-key');
  if (secretKey !== process.env.SEED_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const passwordHash = await hashPassword('password123');

    const demoUsers = [
      {
        id: crypto.randomUUID(),
        email: 'alice@demo.com',
        display_name: 'Alice',
        playing_style: ['casual', 'story-driven'],
        interests: ['RPG', 'puzzle', 'indie'],
        bio: 'Love exploring new worlds in games!',
        real_name: 'Alice Johnson',
        occupation: 'Game Designer',
      },
      {
        id: crypto.randomUUID(),
        email: 'bob@demo.com',
        display_name: 'Bob',
        playing_style: ['competitive', 'hardcore'],
        interests: ['FPS', 'strategy', 'esports'],
        bio: 'Always up for a challenge!',
        real_name: 'Bob Smith',
        occupation: 'Software Engineer',
      },
      {
        id: crypto.randomUUID(),
        email: 'charlie@demo.com',
        display_name: 'Charlie',
        playing_style: ['casual', 'social'],
        interests: ['party games', 'co-op', 'simulation'],
        bio: 'Games are better with friends!',
        real_name: 'Charlie Brown',
        occupation: 'Marketing Manager',
      },
    ];

    for (const user of demoUsers) {
      await sql`
        INSERT INTO users (id, email, password_hash, display_name, playing_style, interests, bio, real_name, occupation)
        VALUES (${user.id}, ${user.email}, ${passwordHash}, ${user.display_name},
                ${JSON.stringify(user.playing_style)}, ${JSON.stringify(user.interests)},
                ${user.bio}, ${user.real_name}, ${user.occupation})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    const usersResult = await sql`
      SELECT id FROM users WHERE email IN ('alice@demo.com', 'bob@demo.com')
      ORDER BY email
    `;

    if (usersResult.rows.length >= 2) {
      const aliceId = usersResult.rows[0].id;
      const bobId = usersResult.rows[1].id;

      const [user1_id, user2_id] = aliceId < bobId ? [aliceId, bobId] : [bobId, aliceId];

      await sql`
        INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
        VALUES (${user1_id}, ${user2_id}, 75.5, 'matched')
        ON CONFLICT (user1_id, user2_id) DO NOTHING
      `;

      const matchResult = await sql`
        SELECT id FROM matches WHERE user1_id = ${user1_id} AND user2_id = ${user2_id}
      `;

      if (matchResult.rows.length > 0) {
        const matchId = matchResult.rows[0].id;

        await sql`
          INSERT INTO messages (match_id, sender_id, content)
          VALUES
            (${matchId}, ${aliceId}, 'Hey! I saw we both love RPGs!'),
            (${matchId}, ${bobId}, 'Yes! Have you played any good ones lately?'),
            (${matchId}, ${aliceId}, 'Just finished Baldur''s Gate 3, it was amazing!')
          ON CONFLICT DO NOTHING
        `;

        await sql`
          UPDATE intimacy_scores
          SET score = 30
          WHERE match_id = ${matchId}
        `;
      }
    }

    await sql`
      INSERT INTO activities (name, type, description, instructions, intimacy_points, config)
      VALUES
        ('Two Truths and a Lie', 'game', 'Share two truths and one lie about yourself', 'Each player shares 3 statements. Guess which one is false!', 10, '{}'),
        ('20 Questions', 'game', 'Classic guessing game', 'Think of something and answer yes/no questions', 15, '{}'),
        ('Would You Rather', 'game', 'Make tough choices together', 'Take turns asking would you rather questions', 10, '{}'),
        ('Playlist Exchange', 'share', 'Share your favorite music', 'Create a short playlist of songs that represent you', 20, '{}'),
        ('Gaming Memory', 'share', 'Share your favorite gaming memory', 'Tell a story about your most memorable gaming moment', 15, '{}')
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
