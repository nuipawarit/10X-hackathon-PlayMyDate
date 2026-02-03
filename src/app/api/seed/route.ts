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
    // Drop all tables and recreate (hard reset)
    await sql`DROP TABLE IF EXISTS user_rewards CASCADE`;
    await sql`DROP TABLE IF EXISTS rewards CASCADE`;
    await sql`DROP TABLE IF EXISTS daily_checkins CASCADE`;
    await sql`DROP TABLE IF EXISTS playcoin_transactions CASCADE`;
    await sql`DROP TABLE IF EXISTS playcoin_wallets CASCADE`;
    await sql`DROP TABLE IF EXISTS typing_status CASCADE`;
    await sql`DROP TABLE IF EXISTS activity_instances CASCADE`;
    await sql`DROP TABLE IF EXISTS activities CASCADE`;
    await sql`DROP TABLE IF EXISTS messages CASCADE`;
    await sql`DROP TABLE IF EXISTS intimacy_scores CASCADE`;
    await sql`DROP TABLE IF EXISTS matches CASCADE`;
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Create users table with new columns
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        playing_style JSONB DEFAULT '[]',
        interests JSONB DEFAULT '[]',
        bio TEXT,
        real_name VARCHAR(100),
        photo_url TEXT,
        occupation VARCHAR(100),
        phone VARCHAR(20),
        avatar_config JSONB,
        voice_note_url TEXT,
        behavioral_persona VARCHAR(50),
        subscription_tier VARCHAR(20) DEFAULT 'free',
        subscription_expires_at TIMESTAMP,
        referral_code VARCHAR(50) UNIQUE,
        referred_by_user_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create sessions table
    await sql`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `;

    // Create matches table with new columns
    await sql`
      CREATE TABLE matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user1_id UUID NOT NULL REFERENCES users(id),
        user2_id UUID NOT NULL REFERENCES users(id),
        compatibility_score DECIMAL(5,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'matched',
        chemistry_score INTEGER DEFAULT 0,
        mission_streak INTEGER DEFAULT 0,
        paradise_mode_unlocked BOOLEAN DEFAULT false,
        paradise_mode_unlocked_at TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user1_id, user2_id)
      )
    `;

    // Create intimacy_scores table
    await sql`
      CREATE TABLE intimacy_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID UNIQUE NOT NULL REFERENCES matches(id),
        score INTEGER DEFAULT 0,
        unlocks JSONB DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create messages table with new columns
    await sql`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID NOT NULL REFERENCES matches(id),
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create activities table with new columns
    await sql`
      CREATE TABLE activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        instructions TEXT,
        intimacy_points INTEGER NOT NULL DEFAULT 0,
        config JSONB DEFAULT '{}',
        coin_reward INTEGER DEFAULT 0,
        difficulty_level INTEGER DEFAULT 1,
        estimated_duration_minutes INTEGER DEFAULT 10,
        is_branded BOOLEAN DEFAULT false,
        sponsor_merchant_id UUID,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create activity_instances table with new columns
    await sql`
      CREATE TABLE activity_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID NOT NULL REFERENCES matches(id),
        activity_id UUID NOT NULL REFERENCES activities(id),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        progress JSONB DEFAULT '{}',
        result JSONB,
        coins_earned INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create typing_status table
    await sql`
      CREATE TABLE typing_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID NOT NULL REFERENCES matches(id),
        user_id UUID NOT NULL REFERENCES users(id),
        is_typing BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(match_id, user_id)
      )
    `;

    // Create playcoin_wallets table
    await sql`
      CREATE TABLE playcoin_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id),
        balance INTEGER DEFAULT 0,
        lifetime_earned INTEGER DEFAULT 0,
        lifetime_spent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create playcoin_transactions table
    await sql`
      CREATE TABLE playcoin_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID NOT NULL REFERENCES playcoin_wallets(id),
        type VARCHAR(20) NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        source VARCHAR(50),
        reference_id UUID,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create daily_checkins table
    await sql`
      CREATE TABLE daily_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        checkin_date DATE NOT NULL,
        streak_count INTEGER DEFAULT 1,
        coins_earned INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, checkin_date)
      )
    `;

    // Create rewards table
    await sql`
      CREATE TABLE rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        coin_cost INTEGER NOT NULL,
        stock_quantity INTEGER,
        partner_id UUID,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create user_rewards table
    await sql`
      CREATE TABLE user_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        reward_id UUID NOT NULL REFERENCES rewards(id),
        transaction_id UUID REFERENCES playcoin_transactions(id),
        status VARCHAR(20) DEFAULT 'redeemed',
        redeemed_at TIMESTAMP DEFAULT NOW(),
        used_at TIMESTAMP,
        expires_at TIMESTAMP
      )
    `;

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
      const referralCode = `${user.display_name?.toUpperCase().slice(0, 4)}${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      await sql`
        INSERT INTO users (id, email, password_hash, display_name, playing_style, interests, bio, real_name, occupation, referral_code, subscription_tier)
        VALUES (${user.id}, ${user.email}, ${passwordHash}, ${user.display_name},
                ${JSON.stringify(user.playing_style)}, ${JSON.stringify(user.interests)},
                ${user.bio}, ${user.real_name}, ${user.occupation}, ${referralCode}, 'free')
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

    // Seed activities with coin rewards
    await sql`
      INSERT INTO activities (name, type, description, instructions, intimacy_points, coin_reward, difficulty_level, estimated_duration_minutes, config)
      VALUES
        ('Two Truths and a Lie', 'game', 'Share two truths and one lie about yourself', 'Each player shares 3 statements. Guess which one is false!', 10, 15, 1, 10, '{}'),
        ('20 Questions', 'game', 'Classic guessing game', 'Think of something and answer yes/no questions', 15, 20, 2, 15, '{}'),
        ('Would You Rather', 'game', 'Make tough choices together', 'Take turns asking would you rather questions', 10, 10, 1, 10, '{}'),
        ('Playlist Exchange', 'share', 'Share your favorite music', 'Create a short playlist of songs that represent you', 20, 25, 2, 20, '{}'),
        ('Gaming Memory', 'share', 'Share your favorite gaming memory', 'Tell a story about your most memorable gaming moment', 15, 20, 1, 15, '{}'),
        ('Photo Challenge', 'creative', 'Take creative photos together', 'Complete the photo challenge and share your best shots', 25, 30, 2, 30, '{}'),
        ('Quick Quiz', 'quiz', 'Test your knowledge about each other', 'Answer questions about your match to earn points', 15, 20, 1, 10, '{}')
    `;

    // Create playcoin wallets for demo users with initial balance
    for (const user of demoUsers) {
      await sql`
        INSERT INTO playcoin_wallets (user_id, balance, lifetime_earned)
        VALUES (${user.id}, 100, 100)
      `;
    }

    // Seed some rewards
    await sql`
      INSERT INTO rewards (name, description, type, coin_cost, stock_quantity, is_active)
      VALUES
        ('Super Like Boost', 'Get 3x visibility for 24 hours', 'powerup', 50, NULL, true),
        ('Icebreaker Pack', '5 unique icebreaker questions', 'powerup', 30, NULL, true),
        ('Premium Avatar Frame', 'Exclusive golden frame for your avatar', 'avatar_item', 100, NULL, true),
        ('Coffee Voucher', '50 THB off at partner cafes', 'voucher', 200, 100, true),
        ('Movie Ticket', 'Free movie ticket at Major Cineplex', 'voucher', 500, 50, true)
    `;

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully with PlayCoin tables',
    });
  } catch (error) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, details: String(error) }, { status: 500 });
  }
}
