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
    // Clear existing data (order matters due to foreign keys)
    await sql`DELETE FROM activity_instances`;
    await sql`DELETE FROM messages`;
    await sql`DELETE FROM intimacy_scores`;
    await sql`DELETE FROM matches`;
    await sql`DELETE FROM sessions`;
    await sql`DELETE FROM users`;

    const passwordHash = await hashPassword('password123');

    // Demo users matching original initial state
    const aliceId = crypto.randomUUID();
    const bobId = crypto.randomUUID();
    const charlieId = crypto.randomUUID();

    const demoUsers = [
      {
        id: aliceId,
        email: 'alice@demo.com',
        display_name: 'Alice',
        playing_style: ['casual', 'creative'],
        interests: ['music', 'travel', 'cooking'],
        bio: 'Love exploring new places and trying new recipes!',
        real_name: 'Alice Smith',
        occupation: 'UX Designer',
      },
      {
        id: bobId,
        email: 'bob@demo.com',
        display_name: 'Bob',
        playing_style: ['competitive', 'strategic'],
        interests: ['gaming', 'tech', 'movies'],
        bio: 'Gamer and tech enthusiast looking for meaningful connections.',
        real_name: 'Bob Johnson',
        occupation: 'Software Engineer',
      },
      {
        id: charlieId,
        email: 'charlie@demo.com',
        display_name: 'Charlie',
        playing_style: ['casual', 'social'],
        interests: ['music', 'art', 'hiking'],
        bio: 'Artist who loves nature and good conversations.',
        real_name: 'Charlie Brown',
        occupation: 'Graphic Designer',
      },
    ];

    for (const user of demoUsers) {
      await sql`
        INSERT INTO users (id, email, password_hash, display_name, playing_style, interests, bio, real_name, occupation)
        VALUES (${user.id}, ${user.email}, ${passwordHash}, ${user.display_name},
                ${JSON.stringify(user.playing_style)}, ${JSON.stringify(user.interests)},
                ${user.bio}, ${user.real_name}, ${user.occupation})
      `;
    }

    // Match 1: Alice ↔ Bob (score 85, intimacy 50, unlocks: real_name + photo)
    const [ab1, ab2] = aliceId < bobId ? [aliceId, bobId] : [bobId, aliceId];
    await sql`
      INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
      VALUES (${ab1}, ${ab2}, 85, 'matched')
    `;

    const aliceBobMatch = await sql`
      SELECT id FROM matches WHERE user1_id = ${ab1} AND user2_id = ${ab2}
    `;

    if (aliceBobMatch.rows.length > 0) {
      const matchId = aliceBobMatch.rows[0].id;

      // Intimacy score 50
      await sql`
        INSERT INTO intimacy_scores (match_id, score)
        VALUES (${matchId}, 50)
        ON CONFLICT (match_id) DO UPDATE SET score = 50
      `;

      // 4 messages
      await sql`
        INSERT INTO messages (match_id, sender_id, content)
        VALUES
          (${matchId}, ${aliceId}, 'Hey! Nice to match with you 😊'),
          (${matchId}, ${bobId}, 'Hi Alice! Love your profile, cooking is awesome!'),
          (${matchId}, ${aliceId}, 'Thanks! What games do you play?'),
          (${matchId}, ${bobId}, 'Mostly strategy games and some FPS. Do you game at all?')
      `;
    }

    // Match 2: Bob ↔ Charlie (score 72, intimacy 30, unlocks: real_name)
    const [bc1, bc2] = bobId < charlieId ? [bobId, charlieId] : [charlieId, bobId];
    await sql`
      INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
      VALUES (${bc1}, ${bc2}, 72, 'matched')
    `;

    const bobCharlieMatch = await sql`
      SELECT id FROM matches WHERE user1_id = ${bc1} AND user2_id = ${bc2}
    `;

    if (bobCharlieMatch.rows.length > 0) {
      const matchId = bobCharlieMatch.rows[0].id;

      // Intimacy score 30
      await sql`
        INSERT INTO intimacy_scores (match_id, score)
        VALUES (${matchId}, 30)
        ON CONFLICT (match_id) DO UPDATE SET score = 30
      `;

      // 2 messages
      await sql`
        INSERT INTO messages (match_id, sender_id, content)
        VALUES
          (${matchId}, ${bobId}, 'Hey Charlie! I see you like hiking too!'),
          (${matchId}, ${charlieId}, 'Yeah! I try to go every weekend. Any favorite trails?')
      `;
    }

    // Seed activities
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, details: String(error) }, { status: 500 });
  }
}
