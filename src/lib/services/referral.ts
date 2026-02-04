import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { earnCoins } from './playcoin';

export const REFERRAL_BONUS = 100;
export const REFERRED_BONUS = 50;

export interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalEarned: number;
}

export async function generateReferralCode(userId: string, displayName?: string): Promise<ServiceResult<string>> {
  try {
    const existing = await sql`
      SELECT referral_code FROM users WHERE id = ${userId}
    `;

    if (existing.rows.length > 0 && existing.rows[0].referral_code) {
      return success(existing.rows[0].referral_code as string);
    }

    const prefix = (displayName?.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'USER');
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralCode = `${prefix}${suffix}`;

    await sql`
      UPDATE users SET referral_code = ${referralCode} WHERE id = ${userId}
    `;

    return success(referralCode);
  } catch (error) {
    console.error('generateReferralCode error:', error);
    return failure('Failed to generate referral code', 'INTERNAL_ERROR');
  }
}

export async function validateReferralCode(code: string): Promise<ServiceResult<{ userId: string; displayName: string | null }>> {
  try {
    const result = await sql`
      SELECT id, display_name FROM users WHERE referral_code = ${code.toUpperCase()}
    `;

    if (result.rows.length === 0) {
      return failure('Invalid referral code', 'NOT_FOUND');
    }

    return success({
      userId: result.rows[0].id as string,
      displayName: result.rows[0].display_name as string | null,
    });
  } catch (error) {
    console.error('validateReferralCode error:', error);
    return failure('Failed to validate referral code', 'INTERNAL_ERROR');
  }
}

export async function applyReferral(
  newUserId: string,
  referralCode: string
): Promise<ServiceResult<{ referrerId: string }>> {
  try {
    const validateResult = await validateReferralCode(referralCode);
    if (!validateResult.success) {
      return failure(validateResult.error, validateResult.code);
    }

    const referrerId = validateResult.data.userId;

    if (referrerId === newUserId) {
      return failure('Cannot use your own referral code', 'INVALID_REFERRAL');
    }

    await sql`
      UPDATE users SET referred_by_user_id = ${referrerId} WHERE id = ${newUserId}
    `;

    await earnCoins(referrerId, REFERRAL_BONUS, 'referral_bonus', newUserId);
    await earnCoins(newUserId, REFERRED_BONUS, 'referral_welcome', referrerId);

    return success({ referrerId });
  } catch (error) {
    console.error('applyReferral error:', error);
    return failure('Failed to apply referral', 'INTERNAL_ERROR');
  }
}

export async function getReferralStats(userId: string): Promise<ServiceResult<ReferralStats>> {
  try {
    const userResult = await sql`
      SELECT referral_code, display_name FROM users WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return failure('User not found', 'NOT_FOUND');
    }

    let referralCode = userResult.rows[0].referral_code as string | null;
    if (!referralCode) {
      const generateResult = await generateReferralCode(userId, userResult.rows[0].display_name as string);
      if (generateResult.success) {
        referralCode = generateResult.data;
      } else {
        return failure(generateResult.error, generateResult.code);
      }
    }

    const countResult = await sql`
      SELECT COUNT(*) as count FROM users WHERE referred_by_user_id = ${userId}
    `;

    const referralCount = parseInt(countResult.rows[0].count as string, 10);
    const totalEarned = referralCount * REFERRAL_BONUS;

    return success({
      referralCode,
      referralCount,
      totalEarned,
    });
  } catch (error) {
    console.error('getReferralStats error:', error);
    return failure('Failed to get referral stats', 'INTERNAL_ERROR');
  }
}
