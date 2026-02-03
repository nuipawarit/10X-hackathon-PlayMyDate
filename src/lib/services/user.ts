import { sql, type User, type PublicUser } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { success, failure, type ServiceResult } from './types';
import type { RegisterInput, UpdateProfileInput } from '@/lib/validations/user';

export async function getUserById(userId: string): Promise<ServiceResult<User>> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (result.rows.length === 0) {
      return failure('User not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as User);
  } catch (error) {
    console.error('getUserById error:', error);
    return failure('Failed to get user', 'INTERNAL_ERROR');
  }
}

export async function getUserByEmail(email: string): Promise<ServiceResult<User | null>> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return success(null);
    }

    return success(result.rows[0] as User);
  } catch (error) {
    console.error('getUserByEmail error:', error);
    return failure('Failed to get user', 'INTERNAL_ERROR');
  }
}

export async function createUser(input: RegisterInput): Promise<ServiceResult<User>> {
  try {
    const existingResult = await sql`
      SELECT id FROM users WHERE email = ${input.email}
    `;

    if (existingResult.rows.length > 0) {
      return failure('Email already registered', 'DUPLICATE_EMAIL');
    }

    const passwordHash = await hashPassword(input.password);

    const result = await sql`
      INSERT INTO users (email, password_hash, display_name)
      VALUES (${input.email}, ${passwordHash}, ${input.displayName || null})
      RETURNING *
    `;

    return success(result.rows[0] as User);
  } catch (error) {
    console.error('createUser error:', error);
    return failure('Failed to create user', 'INTERNAL_ERROR');
  }
}

export async function validateLogin(
  email: string,
  password: string
): Promise<ServiceResult<User>> {
  try {
    const result = await sql`
      SELECT id, email, password_hash, display_name
      FROM users
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return failure('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0] as User;
    const validPassword = await verifyPassword(user.password_hash, password);

    if (!validPassword) {
      return failure('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    return success(user);
  } catch (error) {
    console.error('validateLogin error:', error);
    return failure('Failed to validate login', 'INTERNAL_ERROR');
  }
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<ServiceResult<User>> {
  try {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (input.displayName !== undefined) {
      sets.push('display_name');
      values.push(input.displayName);
    }
    if (input.playingStyle !== undefined) {
      sets.push('playing_style');
      values.push(JSON.stringify(input.playingStyle));
    }
    if (input.interests !== undefined) {
      sets.push('interests');
      values.push(JSON.stringify(input.interests));
    }
    if (input.bio !== undefined) {
      sets.push('bio');
      values.push(input.bio);
    }
    if (input.realName !== undefined) {
      sets.push('real_name');
      values.push(input.realName);
    }
    if (input.photoUrl !== undefined) {
      sets.push('photo_url');
      values.push(input.photoUrl);
    }
    if (input.occupation !== undefined) {
      sets.push('occupation');
      values.push(input.occupation);
    }
    if (input.phone !== undefined) {
      sets.push('phone');
      values.push(input.phone);
    }

    if (sets.length === 0) {
      return getUserById(userId);
    }

    const result = await sql`
      UPDATE users
      SET display_name = COALESCE(${input.displayName}, display_name),
          playing_style = COALESCE(${input.playingStyle ? JSON.stringify(input.playingStyle) : null}::jsonb, playing_style),
          interests = COALESCE(${input.interests ? JSON.stringify(input.interests) : null}::jsonb, interests),
          bio = COALESCE(${input.bio}, bio),
          real_name = COALESCE(${input.realName}, real_name),
          photo_url = COALESCE(${input.photoUrl}, photo_url),
          occupation = COALESCE(${input.occupation}, occupation),
          phone = COALESCE(${input.phone}, phone),
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('User not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as User);
  } catch (error) {
    console.error('updateProfile error:', error);
    return failure('Failed to update profile', 'INTERNAL_ERROR');
  }
}

export function toPublicUser(user: User, unlocks: string[] = []): PublicUser {
  const publicUser: PublicUser = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    playing_style: user.playing_style,
    interests: user.interests,
    bio: user.bio,
    avatar_config: user.avatar_config,
    voice_note_url: user.voice_note_url,
    behavioral_persona: user.behavioral_persona,
    subscription_tier: user.subscription_tier,
    subscription_expires_at: user.subscription_expires_at,
    referral_code: user.referral_code,
    referred_by_user_id: user.referred_by_user_id,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  if (unlocks.includes('real_name')) {
    publicUser.real_name = user.real_name;
  }
  if (unlocks.includes('photo')) {
    publicUser.photo_url = user.photo_url;
  }
  if (unlocks.includes('occupation')) {
    publicUser.occupation = user.occupation;
  }

  return publicUser;
}
