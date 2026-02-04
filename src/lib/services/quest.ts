import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { earnCoins } from './playcoin';

export interface BrandedQuest {
  id: string;
  campaign_id: string;
  activity_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  coin_reward: number;
  voucher_reward_id: string | null;
  max_completions: number | null;
  completion_count: number;
  is_active: boolean;
  created_at: Date;
}

export interface QuestCompletion {
  id: string;
  branded_quest_id: string;
  user_id: string;
  match_id: string;
  completed_at: Date;
  reward_granted: boolean;
}

export interface CreateBrandedQuestInput {
  activityId: string;
  name: string;
  description?: string;
  instructions?: string;
  coinReward?: number;
  voucherRewardId?: string;
  maxCompletions?: number;
}

export async function createBrandedQuest(
  campaignId: string,
  data: CreateBrandedQuestInput
): Promise<ServiceResult<BrandedQuest>> {
  try {
    const campaignResult = await sql`
      SELECT id, merchant_id FROM campaigns WHERE id = ${campaignId}
    `;

    if (campaignResult.rows.length === 0) {
      return failure('Campaign not found', 'NOT_FOUND');
    }

    const activityResult = await sql`
      SELECT id FROM activities WHERE id = ${data.activityId}
    `;

    if (activityResult.rows.length === 0) {
      return failure('Activity not found', 'NOT_FOUND');
    }

    const result = await sql`
      INSERT INTO branded_quests (
        campaign_id, activity_id, name, description, instructions,
        coin_reward, voucher_reward_id, max_completions, is_active
      )
      VALUES (
        ${campaignId}, ${data.activityId}, ${data.name},
        ${data.description ?? null}, ${data.instructions ?? null},
        ${data.coinReward ?? 0}, ${data.voucherRewardId ?? null},
        ${data.maxCompletions ?? null}, true
      )
      RETURNING *
    `;

    return success(result.rows[0] as BrandedQuest);
  } catch (error) {
    console.error('createBrandedQuest error:', error);
    return failure('Failed to create branded quest', 'INTERNAL_ERROR');
  }
}

export async function getQuestsForCampaign(campaignId: string): Promise<ServiceResult<BrandedQuest[]>> {
  try {
    const result = await sql`
      SELECT * FROM branded_quests
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at DESC
    `;

    return success(result.rows as BrandedQuest[]);
  } catch (error) {
    console.error('getQuestsForCampaign error:', error);
    return failure('Failed to get quests', 'INTERNAL_ERROR');
  }
}

export async function getActiveQuests(): Promise<ServiceResult<BrandedQuest[]>> {
  try {
    const result = await sql`
      SELECT bq.* FROM branded_quests bq
      JOIN campaigns c ON bq.campaign_id = c.id
      WHERE bq.is_active = true
      AND c.status = 'active'
      AND (bq.max_completions IS NULL OR bq.completion_count < bq.max_completions)
      ORDER BY bq.coin_reward DESC
    `;

    return success(result.rows as BrandedQuest[]);
  } catch (error) {
    console.error('getActiveQuests error:', error);
    return failure('Failed to get active quests', 'INTERNAL_ERROR');
  }
}

export async function trackQuestCompletion(
  questId: string,
  userId: string,
  matchId: string
): Promise<ServiceResult<{ completion: QuestCompletion; coinsEarned: number }>> {
  try {
    const questResult = await sql`
      SELECT bq.*, c.status as campaign_status FROM branded_quests bq
      JOIN campaigns c ON bq.campaign_id = c.id
      WHERE bq.id = ${questId}
    `;

    if (questResult.rows.length === 0) {
      return failure('Quest not found', 'NOT_FOUND');
    }

    const quest = questResult.rows[0];

    if (!quest.is_active || quest.campaign_status !== 'active') {
      return failure('Quest is not active', 'QUEST_INACTIVE');
    }

    if (quest.max_completions && quest.completion_count >= quest.max_completions) {
      return failure('Quest has reached maximum completions', 'MAX_COMPLETIONS_REACHED');
    }

    const existingCompletion = await sql`
      SELECT id FROM quest_completions
      WHERE branded_quest_id = ${questId} AND user_id = ${userId}
    `;

    if (existingCompletion.rows.length > 0) {
      return failure('Quest already completed by this user', 'ALREADY_COMPLETED');
    }

    const completionResult = await sql`
      INSERT INTO quest_completions (branded_quest_id, user_id, match_id, reward_granted)
      VALUES (${questId}, ${userId}, ${matchId}, true)
      RETURNING *
    `;

    await sql`
      UPDATE branded_quests
      SET completion_count = completion_count + 1
      WHERE id = ${questId}
    `;

    const coinReward = quest.coin_reward || 0;
    if (coinReward > 0) {
      await earnCoins(userId, coinReward, 'quest_completion', questId);
    }

    return success({
      completion: completionResult.rows[0] as QuestCompletion,
      coinsEarned: coinReward,
    });
  } catch (error) {
    console.error('trackQuestCompletion error:', error);
    return failure('Failed to track quest completion', 'INTERNAL_ERROR');
  }
}

export async function getUserQuestCompletions(userId: string): Promise<ServiceResult<QuestCompletion[]>> {
  try {
    const result = await sql`
      SELECT * FROM quest_completions
      WHERE user_id = ${userId}
      ORDER BY completed_at DESC
    `;

    return success(result.rows as QuestCompletion[]);
  } catch (error) {
    console.error('getUserQuestCompletions error:', error);
    return failure('Failed to get quest completions', 'INTERNAL_ERROR');
  }
}
