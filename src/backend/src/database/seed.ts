import { pool, query, queryOne } from '../shared/database/index.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  // Seed activities
  const seedPath = path.join(__dirname, '../../../database/seeds/001_initial_activities.sql');
  if (fs.existsSync(seedPath)) {
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    await pool.query(seedSql);
  }

  // Create demo users
  const password1 = await bcrypt.hash('password123', 10);
  const password2 = await bcrypt.hash('password123', 10);
  const password3 = await bcrypt.hash('password123', 10);

  const user1 = await queryOne(
    `INSERT INTO users (email, password_hash, display_name, playing_style, interests, bio, real_name, photo_url, occupation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET display_name = $3
     RETURNING *`,
    [
      'alice@demo.com',
      password1,
      'Alice',
      JSON.stringify(['adventurous', 'spontaneous']),
      JSON.stringify(['movies', 'coffee', 'hiking', 'photography']),
      'Love exploring new places and meeting new people!',
      'Alice Johnson',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      'Software Engineer',
    ]
  );

  const user2 = await queryOne(
    `INSERT INTO users (email, password_hash, display_name, playing_style, interests, bio, real_name, photo_url, occupation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET display_name = $3
     RETURNING *`,
    [
      'bob@demo.com',
      password2,
      'Bob',
      JSON.stringify(['chill', 'adventurous']),
      JSON.stringify(['gaming', 'coffee', 'music', 'movies']),
      'Gamer by night, coffee enthusiast by day',
      'Bob Smith',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      'Product Designer',
    ]
  );

  const user3 = await queryOne(
    `INSERT INTO users (email, password_hash, display_name, playing_style, interests, bio, real_name, photo_url, occupation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (email) DO UPDATE SET display_name = $3
     RETURNING *`,
    [
      'charlie@demo.com',
      password3,
      'Charlie',
      JSON.stringify(['spontaneous', 'creative']),
      JSON.stringify(['movies', 'photography', 'travel', 'coffee']),
      'Artist and foodie looking for adventure',
      'Charlie Brown',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
      'Graphic Designer',
    ]
  );

  // Create matches
  if (user1 && user2) {
    const [smallerId, largerId] = user1.id < user2.id ? [user1.id, user2.id] : [user2.id, user1.id];
    await queryOne(
      `INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user1_id, user2_id) DO NOTHING
       RETURNING *`,
      [smallerId, largerId, 75.5, 'matched']
    );

    // Create intimacy score for match
    const match = await queryOne(
      'SELECT id FROM matches WHERE user1_id = $1 AND user2_id = $2',
      [smallerId, largerId]
    );
    if (match) {
      await queryOne(
        `INSERT INTO intimacy_scores (match_id, score, unlocks)
         VALUES ($1, $2, $3)
         ON CONFLICT (match_id) DO NOTHING`,
        [match.id, 30, JSON.stringify(['real_name'])]
      );

      // Add some demo messages
      await pool.query(
        `INSERT INTO messages (match_id, sender_id, content)
         VALUES ($1, $2, $3), ($1, $4, $5), ($1, $2, $6)`,
        [
          match.id,
          user1.id, 'Hey! Nice to match with you!',
          user2.id, 'Hi! I see we both love coffee ☕',
          'Yes! What is your favorite coffee shop?',
        ]
      );
    }
  }
}

export async function resetAndSeed() {
  // Truncate all tables (CASCADE handles foreign keys)
  await pool.query('TRUNCATE messages, activity_instances, intimacy_scores, matches, users, activities RESTART IDENTITY CASCADE');

  // Re-seed data
  await seedDatabase();
}

// CLI script - only runs when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('Seeding database...');
  seedDatabase()
    .then(() => {
      console.log('Demo users created');
      console.log('Demo matches and messages created');
      console.log('\nDemo accounts:');
      console.log('  alice@demo.com / password123');
      console.log('  bob@demo.com / password123');
      console.log('  charlie@demo.com / password123');
      console.log('\nSeeding complete!');
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
