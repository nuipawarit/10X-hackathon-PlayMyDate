import { sql, INTIMACY_THRESHOLDS } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import type { UnlockType } from '@/lib/validations/intimacy';

export { INTIMACY_THRESHOLDS };

export interface IntimacyData {
  id: string;
  match_id: string;
  score: number;
  unlocks: string[];
  updated_at: string;
}

export interface IntimacyResponse {
  intimacy: IntimacyData;
  available_unlocks: string[];
  thresholds: typeof INTIMACY_THRESHOLDS;
}

export function getAvailableUnlocks(score: number, currentUnlocks: string[]): string[] {
  const available: string[] = [];

  if (score >= INTIMACY_THRESHOLDS.real_name && !currentUnlocks.includes('real_name')) {
    available.push('real_name');
  }
  if (score >= INTIMACY_THRESHOLDS.photo && !currentUnlocks.includes('photo')) {
    available.push('photo');
  }
  if (score >= INTIMACY_THRESHOLDS.occupation && !currentUnlocks.includes('occupation')) {
    available.push('occupation');
  }
  if (score >= INTIMACY_THRESHOLDS.call && !currentUnlocks.includes('call')) {
    available.push('call');
  }

  return available;
}

export async function getIntimacyForMatch(
  userId: string,
  matchId: string
): Promise<ServiceResult<IntimacyResponse>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const intimacyResult = await sql`
      SELECT * FROM intimacy_scores WHERE match_id = ${matchId}
    `;

    if (intimacyResult.rows.length === 0) {
      return failure('Intimacy record not found', 'NOT_FOUND');
    }

    const intimacy = intimacyResult.rows[0] as IntimacyData;
    const availableUnlocks = getAvailableUnlocks(intimacy.score, intimacy.unlocks || []);

    return success({
      intimacy,
      available_unlocks: availableUnlocks,
      thresholds: INTIMACY_THRESHOLDS,
    });
  } catch (error) {
    console.error('getIntimacyForMatch error:', error);
    return failure('Failed to get intimacy data', 'INTERNAL_ERROR');
  }
}

export async function performUnlock(
  userId: string,
  matchId: string,
  unlockType: UnlockType
): Promise<ServiceResult<IntimacyResponse>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const intimacyResult = await sql`
      SELECT * FROM intimacy_scores WHERE match_id = ${matchId}
    `;

    if (intimacyResult.rows.length === 0) {
      return failure('Intimacy record not found', 'NOT_FOUND');
    }

    const intimacy = intimacyResult.rows[0] as IntimacyData;
    const threshold = INTIMACY_THRESHOLDS[unlockType];

    if (intimacy.score < threshold) {
      return failure(
        `Intimacy score too low. Need ${threshold}, have ${intimacy.score}`,
        'INSUFFICIENT_SCORE'
      );
    }

    const currentUnlocks = intimacy.unlocks || [];
    if (currentUnlocks.includes(unlockType)) {
      return failure('Already unlocked', 'ALREADY_UNLOCKED');
    }

    const newUnlocks = [...currentUnlocks, unlockType];

    const updatedIntimacyResult = await sql`
      UPDATE intimacy_scores
      SET unlocks = ${JSON.stringify(newUnlocks)}
      WHERE match_id = ${matchId}
      RETURNING *
    `;

    const updatedIntimacy = updatedIntimacyResult.rows[0] as IntimacyData;
    const availableUnlocks = getAvailableUnlocks(updatedIntimacy.score, newUnlocks);

    return success({
      intimacy: updatedIntimacy,
      available_unlocks: availableUnlocks,
      thresholds: INTIMACY_THRESHOLDS,
    });
  } catch (error) {
    console.error('performUnlock error:', error);
    return failure('Failed to perform unlock', 'INTERNAL_ERROR');
  }
}

export async function addIntimacyPoints(
  matchId: string,
  points: number
): Promise<ServiceResult<IntimacyData>> {
  try {
    const result = await sql`
      UPDATE intimacy_scores
      SET score = score + ${points}, updated_at = NOW()
      WHERE match_id = ${matchId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('Intimacy record not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as IntimacyData);
  } catch (error) {
    console.error('addIntimacyPoints error:', error);
    return failure('Failed to add intimacy points', 'INTERNAL_ERROR');
  }
}
