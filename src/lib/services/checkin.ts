import { sql, type DailyCheckin } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { earnCoins } from './playcoin';

const BASE_CHECKIN_COINS = 10;
const MAX_STREAK_BONUS = 40;

export function calculateStreakBonus(streakCount: number): number {
  const bonus = Math.min((streakCount - 1) * 5, MAX_STREAK_BONUS);
  return BASE_CHECKIN_COINS + bonus;
}

export async function getCheckinStatus(
  userId: string
): Promise<ServiceResult<{ checkedInToday: boolean; currentStreak: number; lastCheckin: DailyCheckin | null }>> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayResult = await sql`
      SELECT * FROM daily_checkins
      WHERE user_id = ${userId} AND checkin_date = ${today}
    `;

    const yesterdayResult = await sql`
      SELECT * FROM daily_checkins
      WHERE user_id = ${userId} AND checkin_date = ${yesterday}
    `;

    const checkedInToday = todayResult.rows.length > 0;
    let currentStreak = 0;

    if (checkedInToday) {
      currentStreak = (todayResult.rows[0] as DailyCheckin).streak_count;
    } else if (yesterdayResult.rows.length > 0) {
      currentStreak = (yesterdayResult.rows[0] as DailyCheckin).streak_count;
    }

    const lastCheckinResult = await sql`
      SELECT * FROM daily_checkins
      WHERE user_id = ${userId}
      ORDER BY checkin_date DESC
      LIMIT 1
    `;

    return success({
      checkedInToday,
      currentStreak,
      lastCheckin: lastCheckinResult.rows.length > 0 ? (lastCheckinResult.rows[0] as DailyCheckin) : null,
    });
  } catch (error) {
    console.error('getCheckinStatus error:', error);
    return failure('Failed to get check-in status', 'INTERNAL_ERROR');
  }
}

export async function performDailyCheckin(
  userId: string
): Promise<ServiceResult<{ checkin: DailyCheckin; coinsEarned: number; newStreak: number }>> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const existingResult = await sql`
      SELECT * FROM daily_checkins
      WHERE user_id = ${userId} AND checkin_date = ${today}
    `;

    if (existingResult.rows.length > 0) {
      return failure('Already checked in today', 'ALREADY_CHECKED_IN');
    }

    const yesterdayResult = await sql`
      SELECT * FROM daily_checkins
      WHERE user_id = ${userId} AND checkin_date = ${yesterday}
    `;

    let newStreak = 1;
    if (yesterdayResult.rows.length > 0) {
      newStreak = (yesterdayResult.rows[0] as DailyCheckin).streak_count + 1;
    }

    const coinsEarned = calculateStreakBonus(newStreak);

    const checkinResult = await sql`
      INSERT INTO daily_checkins (user_id, checkin_date, streak_count, coins_earned)
      VALUES (${userId}, ${today}, ${newStreak}, ${coinsEarned})
      RETURNING *
    `;

    await earnCoins(userId, coinsEarned, 'daily_checkin', checkinResult.rows[0].id as string);

    return success({
      checkin: checkinResult.rows[0] as DailyCheckin,
      coinsEarned,
      newStreak,
    });
  } catch (error) {
    console.error('performDailyCheckin error:', error);
    return failure('Failed to perform check-in', 'INTERNAL_ERROR');
  }
}

export async function getCheckinHistory(
  userId: string,
  limit = 30
): Promise<ServiceResult<DailyCheckin[]>> {
  try {
    const result = await sql`
      SELECT * FROM daily_checkins
      WHERE user_id = ${userId}
      ORDER BY checkin_date DESC
      LIMIT ${limit}
    `;

    return success(result.rows as DailyCheckin[]);
  } catch (error) {
    console.error('getCheckinHistory error:', error);
    return failure('Failed to get check-in history', 'INTERNAL_ERROR');
  }
}
