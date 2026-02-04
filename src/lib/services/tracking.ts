import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface CampaignEvent {
  id: string;
  campaign_id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: Date;
}

export interface TrackEventInput {
  eventType: string;
  eventData?: Record<string, unknown>;
  userId?: string;
}

export interface UserActionInput {
  actionType: string;
  actionData?: Record<string, unknown>;
  referenceId?: string;
}

export async function trackCampaignEvent(
  campaignId: string,
  event: TrackEventInput
): Promise<ServiceResult<CampaignEvent>> {
  try {
    const result = await sql`
      INSERT INTO campaign_events (campaign_id, user_id, event_type, event_data)
      VALUES (${campaignId}, ${event.userId ?? null}, ${event.eventType}, ${event.eventData ? JSON.stringify(event.eventData) : null}::jsonb)
      RETURNING *
    `;

    if (event.eventType === 'impression' || event.eventType === 'click' || event.eventType === 'conversion') {
      await updateCampaignMetrics(campaignId, event.eventType);
    }

    return success(result.rows[0] as CampaignEvent);
  } catch (error) {
    console.error('trackCampaignEvent error:', error);
    return failure('Failed to track campaign event', 'INTERNAL_ERROR');
  }
}

export async function trackUserAction(
  userId: string,
  action: UserActionInput
): Promise<ServiceResult<{ tracked: boolean }>> {
  try {
    await sql`
      INSERT INTO user_behavioral_profiles (user_id, activity_patterns)
      VALUES (
        ${userId},
        jsonb_build_object(${action.actionType}, jsonb_build_array(jsonb_build_object('timestamp', NOW(), 'data', ${action.actionData ? JSON.stringify(action.actionData) : '{}'}::jsonb)))
      )
      ON CONFLICT (user_id) DO UPDATE SET
        activity_patterns = COALESCE(user_behavioral_profiles.activity_patterns, '{}'::jsonb) ||
          jsonb_build_object(
            ${action.actionType},
            COALESCE(user_behavioral_profiles.activity_patterns->${action.actionType}, '[]'::jsonb) ||
            jsonb_build_array(jsonb_build_object('timestamp', NOW(), 'data', ${action.actionData ? JSON.stringify(action.actionData) : '{}'}::jsonb))
          ),
        updated_at = NOW()
    `;

    return success({ tracked: true });
  } catch (error) {
    console.error('trackUserAction error:', error);
    return failure('Failed to track user action', 'INTERNAL_ERROR');
  }
}

export async function getCampaignEvents(
  campaignId: string,
  filters: { eventType?: string; startDate?: string; endDate?: string } = {},
  pagination: { limit: number; offset: number } = { limit: 50, offset: 0 }
): Promise<ServiceResult<{ events: CampaignEvent[]; total: number }>> {
  try {
    let whereConditions = [`campaign_id = '${campaignId}'`];

    if (filters.eventType) {
      whereConditions.push(`event_type = '${filters.eventType}'`);
    }
    if (filters.startDate) {
      whereConditions.push(`created_at >= '${filters.startDate}'`);
    }
    if (filters.endDate) {
      whereConditions.push(`created_at <= '${filters.endDate}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await sql.query(
      `SELECT COUNT(*) as total FROM campaign_events WHERE ${whereClause}`
    );

    const result = await sql.query(
      `SELECT * FROM campaign_events WHERE ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pagination.limit, pagination.offset]
    );

    return success({
      events: result.rows as CampaignEvent[],
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    console.error('getCampaignEvents error:', error);
    return failure('Failed to get campaign events', 'INTERNAL_ERROR');
  }
}

async function updateCampaignMetrics(campaignId: string, eventType: string): Promise<void> {
  const metricKey = `${eventType}s`;
  await sql`
    UPDATE campaigns
    SET metrics = COALESCE(metrics, '{}'::jsonb) ||
      jsonb_build_object(${metricKey}, COALESCE((metrics->${metricKey})::int, 0) + 1)
    WHERE id = ${campaignId}
  `;
}
