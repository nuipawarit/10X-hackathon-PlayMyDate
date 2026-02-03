import { sql, type Activity, type ActivityInstance } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { addIntimacyPoints } from './intimacy';

export async function getAllActivities(): Promise<ServiceResult<Activity[]>> {
  try {
    const result = await sql`
      SELECT * FROM activities ORDER BY name ASC
    `;

    return success(result.rows as Activity[]);
  } catch (error) {
    console.error('getAllActivities error:', error);
    return failure('Failed to get activities', 'INTERNAL_ERROR');
  }
}

export async function getActivityById(activityId: string): Promise<ServiceResult<Activity>> {
  try {
    const result = await sql`
      SELECT * FROM activities WHERE id = ${activityId}
    `;

    if (result.rows.length === 0) {
      return failure('Activity not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Activity);
  } catch (error) {
    console.error('getActivityById error:', error);
    return failure('Failed to get activity', 'INTERNAL_ERROR');
  }
}

export async function getActivityInstances(
  userId: string,
  matchId: string
): Promise<ServiceResult<ActivityInstance[]>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const result = await sql`
      SELECT ai.*, a.name as activity_name, a.type as activity_type
      FROM activity_instances ai
      JOIN activities a ON ai.activity_id = a.id
      WHERE ai.match_id = ${matchId}
      ORDER BY ai.created_at DESC
    `;

    return success(result.rows as ActivityInstance[]);
  } catch (error) {
    console.error('getActivityInstances error:', error);
    return failure('Failed to get activity instances', 'INTERNAL_ERROR');
  }
}

export async function startActivity(
  userId: string,
  matchId: string,
  activityId: string
): Promise<ServiceResult<ActivityInstance>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${matchId}
        AND (user1_id = ${userId} OR user2_id = ${userId})
        AND status = 'matched'
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found or not active', 'NOT_FOUND');
    }

    const activityResult = await sql`
      SELECT * FROM activities WHERE id = ${activityId}
    `;

    if (activityResult.rows.length === 0) {
      return failure('Activity not found', 'NOT_FOUND');
    }

    const existingResult = await sql`
      SELECT * FROM activity_instances
      WHERE match_id = ${matchId}
        AND activity_id = ${activityId}
        AND status = 'in_progress'
    `;

    if (existingResult.rows.length > 0) {
      return success(existingResult.rows[0] as ActivityInstance);
    }

    const result = await sql`
      INSERT INTO activity_instances (match_id, activity_id, status, started_at)
      VALUES (${matchId}, ${activityId}, 'in_progress', NOW())
      RETURNING *
    `;

    return success(result.rows[0] as ActivityInstance);
  } catch (error) {
    console.error('startActivity error:', error);
    return failure('Failed to start activity', 'INTERNAL_ERROR');
  }
}

export async function completeActivity(
  userId: string,
  instanceId: string,
  result?: Record<string, unknown>
): Promise<ServiceResult<{ instance: ActivityInstance; intimacyAdded: number }>> {
  try {
    const instanceResult = await sql`
      SELECT ai.*, a.intimacy_points
      FROM activity_instances ai
      JOIN activities a ON ai.activity_id = a.id
      JOIN matches m ON ai.match_id = m.id
      WHERE ai.id = ${instanceId}
        AND ai.status = 'in_progress'
        AND (m.user1_id = ${userId} OR m.user2_id = ${userId})
    `;

    if (instanceResult.rows.length === 0) {
      return failure('Activity instance not found or already completed', 'NOT_FOUND');
    }

    const instance = instanceResult.rows[0];
    const intimacyPoints = instance.intimacy_points || 0;

    const updateResult = await sql`
      UPDATE activity_instances
      SET status = 'completed',
          completed_at = NOW(),
          result = ${result ? JSON.stringify(result) : null}::jsonb
      WHERE id = ${instanceId}
      RETURNING *
    `;

    if (intimacyPoints > 0) {
      await addIntimacyPoints(instance.match_id, intimacyPoints);
    }

    return success({
      instance: updateResult.rows[0] as ActivityInstance,
      intimacyAdded: intimacyPoints,
    });
  } catch (error) {
    console.error('completeActivity error:', error);
    return failure('Failed to complete activity', 'INTERNAL_ERROR');
  }
}
