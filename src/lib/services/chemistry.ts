import { sql, type Match } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

const CHEMISTRY_ACTION_POINTS = {
  message: 1,
  activity_complete: 5,
  daily_mission_complete: 10,
  daily_checkin: 2,
  unlock: 3,
} as const;

const PARADISE_MODE_THRESHOLD = 100;
const DECAY_DAYS_THRESHOLD = 7;
const DECAY_AMOUNT = 5;

export type ChemistryData = {
  matchId: string;
  chemistryScore: number;
  missionStreak: number;
  paradiseModeUnlocked: boolean;
  paradiseModeUnlockedAt: string | null;
  lastActivityAt: string;
};

export async function getChemistryScore(matchId: string): Promise<ServiceResult<ChemistryData>> {
  try {
    const result = await sql`
      SELECT id, chemistry_score, mission_streak, paradise_mode_unlocked, paradise_mode_unlocked_at, last_activity_at
      FROM matches
      WHERE id = ${matchId}
    `;

    if (result.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const match = result.rows[0];
    return success({
      matchId: match.id as string,
      chemistryScore: (match.chemistry_score as number) || 0,
      missionStreak: (match.mission_streak as number) || 0,
      paradiseModeUnlocked: (match.paradise_mode_unlocked as boolean) || false,
      paradiseModeUnlockedAt: match.paradise_mode_unlocked_at as string | null,
      lastActivityAt: match.last_activity_at as string,
    });
  } catch (error) {
    console.error('getChemistryScore error:', error);
    return failure('Failed to get chemistry score', 'INTERNAL_ERROR');
  }
}

export async function updateChemistryOnAction(
  matchId: string,
  actionType: keyof typeof CHEMISTRY_ACTION_POINTS
): Promise<ServiceResult<ChemistryData>> {
  try {
    const points = CHEMISTRY_ACTION_POINTS[actionType];

    const result = await sql`
      UPDATE matches
      SET chemistry_score = COALESCE(chemistry_score, 0) + ${points},
          last_activity_at = NOW(),
          updated_at = NOW()
      WHERE id = ${matchId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const match = result.rows[0];

    if ((match.chemistry_score as number) >= PARADISE_MODE_THRESHOLD && !(match.paradise_mode_unlocked as boolean)) {
      await sql`
        UPDATE matches
        SET paradise_mode_unlocked = true,
            paradise_mode_unlocked_at = NOW()
        WHERE id = ${matchId}
      `;
    }

    return getChemistryScore(matchId);
  } catch (error) {
    console.error('updateChemistryOnAction error:', error);
    return failure('Failed to update chemistry', 'INTERNAL_ERROR');
  }
}

export async function updateMissionStreak(
  matchId: string,
  increment: boolean
): Promise<ServiceResult<ChemistryData>> {
  try {
    if (increment) {
      await sql`
        UPDATE matches
        SET mission_streak = COALESCE(mission_streak, 0) + 1,
            updated_at = NOW()
        WHERE id = ${matchId}
      `;
    } else {
      await sql`
        UPDATE matches
        SET mission_streak = 0,
            updated_at = NOW()
        WHERE id = ${matchId}
      `;
    }

    return getChemistryScore(matchId);
  } catch (error) {
    console.error('updateMissionStreak error:', error);
    return failure('Failed to update mission streak', 'INTERNAL_ERROR');
  }
}

export async function applyChemistryDecay(matchId: string): Promise<ServiceResult<ChemistryData>> {
  try {
    const chemResult = await getChemistryScore(matchId);
    if (!chemResult.success) {
      return chemResult;
    }

    const lastActivity = new Date(chemResult.data.lastActivityAt);
    const now = new Date();
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity >= DECAY_DAYS_THRESHOLD) {
      const decayMultiplier = Math.floor(daysSinceActivity / DECAY_DAYS_THRESHOLD);
      const totalDecay = DECAY_AMOUNT * decayMultiplier;

      await sql`
        UPDATE matches
        SET chemistry_score = GREATEST(0, COALESCE(chemistry_score, 0) - ${totalDecay}),
            updated_at = NOW()
        WHERE id = ${matchId}
      `;
    }

    return getChemistryScore(matchId);
  } catch (error) {
    console.error('applyChemistryDecay error:', error);
    return failure('Failed to apply chemistry decay', 'INTERNAL_ERROR');
  }
}

export async function checkUnlockEligibility(
  matchId: string
): Promise<ServiceResult<{ canUnlockParadise: boolean; chemistryScore: number; threshold: number }>> {
  try {
    const result = await getChemistryScore(matchId);
    if (!result.success) {
      return failure(result.error, result.code);
    }

    return success({
      canUnlockParadise: result.data.chemistryScore >= PARADISE_MODE_THRESHOLD && !result.data.paradiseModeUnlocked,
      chemistryScore: result.data.chemistryScore,
      threshold: PARADISE_MODE_THRESHOLD,
    });
  } catch (error) {
    console.error('checkUnlockEligibility error:', error);
    return failure('Failed to check unlock eligibility', 'INTERNAL_ERROR');
  }
}

export async function calculateChemistryFromInteractions(matchId: string): Promise<ServiceResult<number>> {
  try {
    const messageCount = await sql`
      SELECT COUNT(*) as count FROM messages WHERE match_id = ${matchId}
    `;

    const activityCount = await sql`
      SELECT COUNT(*) as count FROM activity_instances
      WHERE match_id = ${matchId} AND status = 'completed'
    `;

    const score =
      parseInt(messageCount.rows[0].count as string, 10) * CHEMISTRY_ACTION_POINTS.message +
      parseInt(activityCount.rows[0].count as string, 10) * CHEMISTRY_ACTION_POINTS.activity_complete;

    return success(score);
  } catch (error) {
    console.error('calculateChemistryFromInteractions error:', error);
    return failure('Failed to calculate chemistry', 'INTERNAL_ERROR');
  }
}
