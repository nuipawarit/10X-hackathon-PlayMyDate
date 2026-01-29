import { query, queryOne, execute } from '../../shared/database/index.js';
import { User } from '../../shared/types/index.js';

export async function createUser(
  email: string,
  passwordHash: string,
  displayName?: string
): Promise<User> {
  const result = await queryOne<User>(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, displayName || null]
  );
  return result!;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
}

export async function findUserById(id: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function updateUserProfile(
  userId: string,
  data: {
    display_name?: string;
    playing_style?: string[];
    interests?: string[];
    bio?: string;
  }
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.display_name !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(data.display_name);
  }
  if (data.playing_style !== undefined) {
    fields.push(`playing_style = $${paramIndex++}`);
    values.push(JSON.stringify(data.playing_style));
  }
  if (data.interests !== undefined) {
    fields.push(`interests = $${paramIndex++}`);
    values.push(JSON.stringify(data.interests));
  }
  if (data.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }

  if (fields.length === 0) return findUserById(userId);

  values.push(userId);

  return queryOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function updateUserPrivateData(
  userId: string,
  data: {
    real_name?: string;
    photo_url?: string;
    occupation?: string;
    phone?: string;
  }
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.real_name !== undefined) {
    fields.push(`real_name = $${paramIndex++}`);
    values.push(data.real_name);
  }
  if (data.photo_url !== undefined) {
    fields.push(`photo_url = $${paramIndex++}`);
    values.push(data.photo_url);
  }
  if (data.occupation !== undefined) {
    fields.push(`occupation = $${paramIndex++}`);
    values.push(data.occupation);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }

  if (fields.length === 0) return findUserById(userId);

  values.push(userId);

  return queryOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function findPotentialMatches(
  userId: string,
  limit: number = 10
): Promise<User[]> {
  return query<User>(
    `SELECT * FROM users
     WHERE id != $1
     AND id NOT IN (
       SELECT user2_id FROM matches WHERE user1_id = $1
       UNION
       SELECT user1_id FROM matches WHERE user2_id = $1
     )
     LIMIT $2`,
    [userId, limit]
  );
}
