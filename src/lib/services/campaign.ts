import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface Campaign {
  id: string;
  merchant_id: string;
  name: string;
  type: string;
  description: string | null;
  budget: string | null;
  spent: string;
  cpa_rate: string | null;
  cpmi_rate: string | null;
  target_audience: Record<string, unknown> | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  metrics: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCampaignInput {
  name: string;
  type: string;
  description?: string;
  budget?: number;
  cpaRate?: number;
  cpmiRate?: number;
  targetAudience?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
}

export interface CampaignFilters {
  status?: string;
  type?: string;
}

export async function createCampaign(
  merchantId: string,
  data: CreateCampaignInput
): Promise<ServiceResult<Campaign>> {
  try {
    const result = await sql`
      INSERT INTO campaigns (
        merchant_id, name, type, description, budget, cpa_rate, cpmi_rate,
        target_audience, start_date, end_date, status
      )
      VALUES (
        ${merchantId}, ${data.name}, ${data.type}, ${data.description ?? null},
        ${data.budget ?? null}, ${data.cpaRate ?? null}, ${data.cpmiRate ?? null},
        ${data.targetAudience ? JSON.stringify(data.targetAudience) : null}::jsonb,
        ${data.startDate ?? null}, ${data.endDate ?? null}, 'draft'
      )
      RETURNING *
    `;

    return success(result.rows[0] as Campaign);
  } catch (error) {
    console.error('createCampaign error:', error);
    return failure('Failed to create campaign', 'INTERNAL_ERROR');
  }
}

export async function getCampaigns(
  merchantId: string,
  filters: CampaignFilters = {},
  pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }
): Promise<ServiceResult<{ campaigns: Campaign[]; total: number }>> {
  try {
    let whereConditions = [`merchant_id = '${merchantId}'`];

    if (filters.status) {
      whereConditions.push(`status = '${filters.status}'`);
    }

    if (filters.type) {
      whereConditions.push(`type = '${filters.type}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await sql.query(
      `SELECT COUNT(*) as total FROM campaigns WHERE ${whereClause}`
    );

    const result = await sql.query(
      `SELECT * FROM campaigns WHERE ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pagination.limit, pagination.offset]
    );

    return success({
      campaigns: result.rows as Campaign[],
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    console.error('getCampaigns error:', error);
    return failure('Failed to get campaigns', 'INTERNAL_ERROR');
  }
}

export async function getCampaignById(
  campaignId: string,
  merchantId: string
): Promise<ServiceResult<Campaign>> {
  try {
    const result = await sql`
      SELECT * FROM campaigns
      WHERE id = ${campaignId} AND merchant_id = ${merchantId}
    `;

    if (result.rows.length === 0) {
      return failure('Campaign not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Campaign);
  } catch (error) {
    console.error('getCampaignById error:', error);
    return failure('Failed to get campaign', 'INTERNAL_ERROR');
  }
}

export async function updateCampaign(
  campaignId: string,
  merchantId: string,
  data: Partial<CreateCampaignInput>
): Promise<ServiceResult<Campaign>> {
  try {
    const result = await sql`
      UPDATE campaigns
      SET
        name = COALESCE(${data.name ?? null}, name),
        type = COALESCE(${data.type ?? null}, type),
        description = COALESCE(${data.description ?? null}, description),
        budget = COALESCE(${data.budget ?? null}, budget),
        cpa_rate = COALESCE(${data.cpaRate ?? null}, cpa_rate),
        cpmi_rate = COALESCE(${data.cpmiRate ?? null}, cpmi_rate),
        target_audience = COALESCE(${data.targetAudience ? JSON.stringify(data.targetAudience) : null}::jsonb, target_audience),
        start_date = COALESCE(${data.startDate ?? null}, start_date),
        end_date = COALESCE(${data.endDate ?? null}, end_date),
        updated_at = NOW()
      WHERE id = ${campaignId} AND merchant_id = ${merchantId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('Campaign not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Campaign);
  } catch (error) {
    console.error('updateCampaign error:', error);
    return failure('Failed to update campaign', 'INTERNAL_ERROR');
  }
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function updateCampaignStatus(
  campaignId: string,
  merchantId: string,
  newStatus: string
): Promise<ServiceResult<Campaign>> {
  try {
    const currentResult = await sql`
      SELECT * FROM campaigns WHERE id = ${campaignId} AND merchant_id = ${merchantId}
    `;

    if (currentResult.rows.length === 0) {
      return failure('Campaign not found', 'NOT_FOUND');
    }

    const currentStatus = currentResult.rows[0].status;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!validTransitions.includes(newStatus)) {
      return failure(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const result = await sql`
      UPDATE campaigns
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${campaignId}
      RETURNING *
    `;

    return success(result.rows[0] as Campaign);
  } catch (error) {
    console.error('updateCampaignStatus error:', error);
    return failure('Failed to update campaign status', 'INTERNAL_ERROR');
  }
}
