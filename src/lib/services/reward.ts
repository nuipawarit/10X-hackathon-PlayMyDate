import { sql, type Reward, type UserReward } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { burnCoins } from './playcoin';

export async function getRewardCatalog(
  filters?: { type?: string; maxCost?: number }
): Promise<ServiceResult<Reward[]>> {
  try {
    let query = sql`
      SELECT * FROM rewards
      WHERE is_active = true
    `;

    if (filters?.type) {
      query = sql`
        SELECT * FROM rewards
        WHERE is_active = true AND type = ${filters.type}
      `;
    }

    if (filters?.maxCost) {
      query = sql`
        SELECT * FROM rewards
        WHERE is_active = true AND coin_cost <= ${filters.maxCost}
      `;
    }

    if (filters?.type && filters?.maxCost) {
      query = sql`
        SELECT * FROM rewards
        WHERE is_active = true AND type = ${filters.type} AND coin_cost <= ${filters.maxCost}
      `;
    }

    const result = await sql`
      SELECT * FROM rewards
      WHERE is_active = true
      ORDER BY coin_cost ASC
    `;

    return success(result.rows as Reward[]);
  } catch (error) {
    console.error('getRewardCatalog error:', error);
    return failure('Failed to get reward catalog', 'INTERNAL_ERROR');
  }
}

export async function getRewardById(rewardId: string): Promise<ServiceResult<Reward>> {
  try {
    const result = await sql`
      SELECT * FROM rewards WHERE id = ${rewardId}
    `;

    if (result.rows.length === 0) {
      return failure('Reward not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Reward);
  } catch (error) {
    console.error('getRewardById error:', error);
    return failure('Failed to get reward', 'INTERNAL_ERROR');
  }
}

export async function redeemReward(
  userId: string,
  rewardId: string
): Promise<ServiceResult<{ userReward: UserReward; reward: Reward }>> {
  try {
    const rewardResult = await getRewardById(rewardId);
    if (!rewardResult.success) {
      return failure(rewardResult.error, rewardResult.code);
    }

    const reward = rewardResult.data;

    if (!reward.is_active) {
      return failure('Reward is no longer available', 'REWARD_UNAVAILABLE');
    }

    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return failure('Reward is out of stock', 'OUT_OF_STOCK');
    }

    const burnResult = await burnCoins(userId, reward.coin_cost, 'reward_redemption', rewardId);
    if (!burnResult.success) {
      return failure(burnResult.error, burnResult.code);
    }

    if (reward.stock_quantity !== null) {
      await sql`
        UPDATE rewards
        SET stock_quantity = stock_quantity - 1
        WHERE id = ${rewardId}
      `;
    }

    const expiresAt = reward.type === 'voucher'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const userRewardResult = await sql`
      INSERT INTO user_rewards (user_id, reward_id, transaction_id, status, expires_at)
      VALUES (${userId}, ${rewardId}, ${burnResult.data.transaction.id}, 'redeemed', ${expiresAt})
      RETURNING *
    `;

    return success({
      userReward: userRewardResult.rows[0] as UserReward,
      reward,
    });
  } catch (error) {
    console.error('redeemReward error:', error);
    return failure('Failed to redeem reward', 'INTERNAL_ERROR');
  }
}

export async function getUserRewards(
  userId: string,
  status?: 'redeemed' | 'used' | 'expired'
): Promise<ServiceResult<(UserReward & { reward: Reward })[]>> {
  try {
    let result;
    if (status) {
      result = await sql`
        SELECT ur.*,
               json_build_object(
                 'id', r.id,
                 'name', r.name,
                 'description', r.description,
                 'type', r.type,
                 'coin_cost', r.coin_cost
               ) as reward
        FROM user_rewards ur
        JOIN rewards r ON ur.reward_id = r.id
        WHERE ur.user_id = ${userId} AND ur.status = ${status}
        ORDER BY ur.redeemed_at DESC
      `;
    } else {
      result = await sql`
        SELECT ur.*,
               json_build_object(
                 'id', r.id,
                 'name', r.name,
                 'description', r.description,
                 'type', r.type,
                 'coin_cost', r.coin_cost
               ) as reward
        FROM user_rewards ur
        JOIN rewards r ON ur.reward_id = r.id
        WHERE ur.user_id = ${userId}
        ORDER BY ur.redeemed_at DESC
      `;
    }

    return success(result.rows as (UserReward & { reward: Reward })[]);
  } catch (error) {
    console.error('getUserRewards error:', error);
    return failure('Failed to get user rewards', 'INTERNAL_ERROR');
  }
}

export async function markRewardAsUsed(
  userId: string,
  userRewardId: string
): Promise<ServiceResult<UserReward>> {
  try {
    const result = await sql`
      UPDATE user_rewards
      SET status = 'used', used_at = NOW()
      WHERE id = ${userRewardId} AND user_id = ${userId} AND status = 'redeemed'
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return failure('User reward not found or already used', 'NOT_FOUND');
    }

    return success(result.rows[0] as UserReward);
  } catch (error) {
    console.error('markRewardAsUsed error:', error);
    return failure('Failed to mark reward as used', 'INTERNAL_ERROR');
  }
}
