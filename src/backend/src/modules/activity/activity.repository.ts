import { query, queryOne, execute } from '../../shared/database/index.js';
import { Activity, ActivityInstance } from '../../shared/types/index.js';

export async function findAllActivities(): Promise<Activity[]> {
  return query<Activity>('SELECT * FROM activities ORDER BY name');
}

export async function findActivityById(activityId: string): Promise<Activity | null> {
  return queryOne<Activity>('SELECT * FROM activities WHERE id = $1', [activityId]);
}

export async function findInstancesByMatch(matchId: string): Promise<ActivityInstance[]> {
  return query<ActivityInstance>(
    `SELECT ai.*, a.name, a.type, a.description, a.instructions, a.intimacy_points, a.config
     FROM activity_instances ai
     JOIN activities a ON a.id = ai.activity_id
     WHERE ai.match_id = $1
     ORDER BY ai.created_at DESC`,
    [matchId]
  );
}

export async function findInstanceById(instanceId: string): Promise<ActivityInstance | null> {
  return queryOne<ActivityInstance>(
    'SELECT * FROM activity_instances WHERE id = $1',
    [instanceId]
  );
}

export async function createActivityInstance(
  matchId: string,
  activityId: string
): Promise<ActivityInstance> {
  const result = await queryOne<ActivityInstance>(
    `INSERT INTO activity_instances (match_id, activity_id, status, started_at)
     VALUES ($1, $2, 'in_progress', NOW())
     RETURNING *`,
    [matchId, activityId]
  );
  return result!;
}

export async function updateInstanceProgress(
  instanceId: string,
  progress: Record<string, any>
): Promise<ActivityInstance | null> {
  return queryOne<ActivityInstance>(
    'UPDATE activity_instances SET progress = $1 WHERE id = $2 RETURNING *',
    [JSON.stringify(progress), instanceId]
  );
}

export async function completeInstance(
  instanceId: string,
  result: Record<string, any>
): Promise<ActivityInstance | null> {
  return queryOne<ActivityInstance>(
    `UPDATE activity_instances
     SET status = 'completed', result = $1, completed_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(result), instanceId]
  );
}

export async function getCompletedActivitiesCount(matchId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM activity_instances
     WHERE match_id = $1 AND status = 'completed'`,
    [matchId]
  );
  return parseInt(result?.count || '0', 10);
}

export async function getAvailableActivities(matchId: string): Promise<Activity[]> {
  return query<Activity>(
    `SELECT a.* FROM activities a
     WHERE a.id NOT IN (
       SELECT activity_id FROM activity_instances
       WHERE match_id = $1 AND status IN ('in_progress', 'completed')
     )
     ORDER BY a.name`,
    [matchId]
  );
}
