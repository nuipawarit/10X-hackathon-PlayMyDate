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
    // Phase 3 tables
    await sql`DROP TABLE IF EXISTS analytics_reports CASCADE`;
    await sql`DROP TABLE IF EXISTS unlock_history CASCADE`;
    await sql`DROP TABLE IF EXISTS campaign_events CASCADE`;
    await sql`DROP TABLE IF EXISTS aggregated_insights CASCADE`;
    await sql`DROP TABLE IF EXISTS user_behavioral_profiles CASCADE`;
    // Phase 2 tables
    await sql`DROP TABLE IF EXISTS quest_completions CASCADE`;
    await sql`DROP TABLE IF EXISTS branded_quests CASCADE`;
    await sql`DROP TABLE IF EXISTS campaigns CASCADE`;
    await sql`DROP TABLE IF EXISTS qr_checkins CASCADE`;
    await sql`DROP TABLE IF EXISTS date_bookings CASCADE`;
    await sql`DROP TABLE IF EXISTS date_venues CASCADE`;
    await sql`DROP TABLE IF EXISTS merchant_sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS merchant_users CASCADE`;
    await sql`DROP TABLE IF EXISTS merchants CASCADE`;
    // Phase 1 tables
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

    // ===== Phase 2 Tables =====

    // Create merchants table
    await sql`
      CREATE TABLE merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        business_type VARCHAR(50) NOT NULL,
        description TEXT,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50),
        address TEXT,
        logo_url TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        tier VARCHAR(20) DEFAULT 'basic',
        api_key VARCHAR(255) UNIQUE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create merchant_users table
    await sql`
      CREATE TABLE merchant_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'staff',
        permissions JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create merchant_sessions table
    await sql`
      CREATE TABLE merchant_sessions (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES merchant_users(id),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `;

    // Create date_venues table
    await sql`
      CREATE TABLE date_venues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID REFERENCES merchants(id),
        name VARCHAR(255) NOT NULL,
        venue_type VARCHAR(50) NOT NULL,
        description TEXT,
        address TEXT,
        location_lat DECIMAL(10, 7),
        location_lng DECIMAL(10, 7),
        price_range INTEGER,
        cuisine_type VARCHAR(50),
        ambiance_tags JSONB,
        opening_hours JSONB,
        booking_enabled BOOLEAN DEFAULT true,
        photos JSONB,
        rating DECIMAL(2, 1),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create date_bookings table
    await sql`
      CREATE TABLE date_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID NOT NULL REFERENCES matches(id),
        venue_id UUID NOT NULL REFERENCES date_venues(id),
        initiated_by_user_id UUID NOT NULL REFERENCES users(id),
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        party_size INTEGER DEFAULT 2,
        special_requests TEXT,
        confirmation_code VARCHAR(50) UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        voucher_applied_id UUID,
        split_bill_preference VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create qr_checkins table
    await sql`
      CREATE TABLE qr_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        venue_id UUID NOT NULL REFERENCES date_venues(id),
        booking_id UUID REFERENCES date_bookings(id),
        qr_code VARCHAR(255) NOT NULL,
        coins_earned INTEGER DEFAULT 0,
        checked_in_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, venue_id, booking_id)
      )
    `;

    // Create campaigns table
    await sql`
      CREATE TABLE campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        budget DECIMAL(10, 2),
        spent DECIMAL(10, 2) DEFAULT 0,
        cpa_rate DECIMAL(10, 2),
        cpmi_rate DECIMAL(10, 2),
        target_audience JSONB,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'draft',
        metrics JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create branded_quests table
    await sql`
      CREATE TABLE branded_quests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id),
        activity_id UUID NOT NULL REFERENCES activities(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        instructions TEXT,
        coin_reward INTEGER DEFAULT 0,
        voucher_reward_id UUID,
        max_completions INTEGER,
        completion_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create quest_completions table
    await sql`
      CREATE TABLE quest_completions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branded_quest_id UUID NOT NULL REFERENCES branded_quests(id),
        user_id UUID NOT NULL REFERENCES users(id),
        match_id UUID NOT NULL REFERENCES matches(id),
        completed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        reward_granted BOOLEAN DEFAULT false,
        UNIQUE(branded_quest_id, user_id)
      )
    `;

    // Add FK to activities.sponsor_merchant_id
    await sql`
      ALTER TABLE activities
      ADD CONSTRAINT activities_sponsor_merchant_id_fkey
      FOREIGN KEY (sponsor_merchant_id) REFERENCES merchants(id)
    `;

    // Add FK to rewards.partner_id
    await sql`
      ALTER TABLE rewards
      ADD CONSTRAINT rewards_partner_id_fkey
      FOREIGN KEY (partner_id) REFERENCES merchants(id)
    `;

    // ===== Phase 3 Tables =====

    // Create user_behavioral_profiles table
    await sql`
      CREATE TABLE user_behavioral_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id),
        persona_type VARCHAR(50),
        engagement_score DECIMAL(5, 2) DEFAULT 0,
        activity_patterns JSONB,
        preferences JSONB,
        last_analyzed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create aggregated_insights table
    await sql`
      CREATE TABLE aggregated_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        insight_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create campaign_events table
    await sql`
      CREATE TABLE campaign_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id),
        user_id UUID REFERENCES users(id),
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create unlock_history table
    await sql`
      CREATE TABLE unlock_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        match_id UUID NOT NULL REFERENCES matches(id),
        unlock_type VARCHAR(50) NOT NULL,
        milestone INTEGER,
        unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create analytics_reports table
    await sql`
      CREATE TABLE analytics_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        report_type VARCHAR(50) NOT NULL,
        config JSONB,
        data JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        generated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    // Create indexes for Phase 3 tables
    await sql`CREATE INDEX idx_behavioral_profiles_user_id ON user_behavioral_profiles(user_id)`;
    await sql`CREATE INDEX idx_aggregated_insights_merchant_id ON aggregated_insights(merchant_id)`;
    await sql`CREATE INDEX idx_campaign_events_campaign_id ON campaign_events(campaign_id)`;
    await sql`CREATE INDEX idx_campaign_events_user_id ON campaign_events(user_id)`;
    await sql`CREATE INDEX idx_unlock_history_user_id ON unlock_history(user_id)`;
    await sql`CREATE INDEX idx_unlock_history_match_id ON unlock_history(match_id)`;
    await sql`CREATE INDEX idx_analytics_reports_merchant_id ON analytics_reports(merchant_id)`;

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

    // ===== Phase 2 Seed Data =====

    // Seed demo merchants
    const merchant1Id = crypto.randomUUID();
    const merchant2Id = crypto.randomUUID();

    await sql`
      INSERT INTO merchants (id, name, business_type, description, contact_email, contact_phone, address, status, tier, api_key)
      VALUES
        (${merchant1Id}, 'Cafe Romantique', 'restaurant', 'Cozy cafe perfect for first dates', 'contact@caferomantique.com', '021234567', '123 Sukhumvit Rd, Bangkok', 'active', 'premium', ${'api_' + crypto.randomUUID().replace(/-/g, '')}),
        (${merchant2Id}, 'Adventure Park BKK', 'entertainment', 'Exciting activities for couples', 'info@adventureparkbkk.com', '029876543', '456 Ratchada Rd, Bangkok', 'active', 'basic', ${'api_' + crypto.randomUUID().replace(/-/g, '')})
    `;

    // Seed merchant users
    const merchantUserHash = await hashPassword('merchant123');
    await sql`
      INSERT INTO merchant_users (merchant_id, email, password_hash, display_name, role)
      VALUES
        (${merchant1Id}, 'admin@caferomantique.com', ${merchantUserHash}, 'Cafe Admin', 'admin'),
        (${merchant2Id}, 'admin@adventureparkbkk.com', ${merchantUserHash}, 'Park Admin', 'admin')
    `;

    // Seed date venues
    await sql`
      INSERT INTO date_venues (merchant_id, name, venue_type, description, address, location_lat, location_lng, price_range, cuisine_type, ambiance_tags, booking_enabled, rating, is_active)
      VALUES
        (${merchant1Id}, 'Cafe Romantique - Thonglor', 'cafe', 'Intimate cafe with amazing coffee and desserts', '123 Thonglor Soi 10, Bangkok', 13.7326, 100.5847, 2, 'cafe', '["romantic", "quiet", "cozy"]', true, 4.5, true),
        (${merchant1Id}, 'Cafe Romantique - Ari', 'cafe', 'Garden cafe with relaxing atmosphere', '45 Ari Soi 4, Bangkok', 13.7902, 100.5448, 2, 'cafe', '["garden", "relaxing", "instagram"]', true, 4.3, true),
        (${merchant2Id}, 'Adventure Park - Escape Room', 'entertainment', 'Exciting escape room challenges for couples', '456 Ratchada Rd, Bangkok', 13.7645, 100.5742, 3, NULL, '["exciting", "teamwork", "fun"]', true, 4.7, true),
        (${merchant2Id}, 'Adventure Park - Mini Golf', 'entertainment', 'Fun mini golf course with drinks', '456 Ratchada Rd, Bangkok', 13.7645, 100.5742, 2, NULL, '["fun", "casual", "outdoor"]', true, 4.2, true),
        (NULL, 'Sky Bar Bangkok', 'bar', 'Rooftop bar with stunning city views', '789 Silom Rd, Bangkok', 13.7220, 100.5260, 4, 'bar', '["rooftop", "romantic", "views"]', false, 4.8, true),
        (NULL, 'Dinner in the Sky', 'restaurant', 'Unique dining experience 50m in the air', '999 Asok Rd, Bangkok', 13.7380, 100.5607, 5, 'fine_dining', '["unique", "memorable", "luxury"]', true, 4.9, true)
    `;

    // Seed a demo campaign
    await sql`
      INSERT INTO campaigns (merchant_id, name, type, description, budget, status, start_date, end_date)
      VALUES
        (${merchant1Id}, 'Valentine Special 2026', 'seasonal', 'Special offers for couples during Valentine season', 50000.00, 'active', '2026-02-01', '2026-02-28')
    `;

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully with Phase 3 tables',
    });
  } catch (error) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, details: String(error) }, { status: 500 });
  }
}
