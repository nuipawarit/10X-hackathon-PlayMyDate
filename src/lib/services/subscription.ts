import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export type SubscriptionTier = 'free' | 'plus' | 'premium';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  priceId: string | null;
  features: string[];
  limits: {
    dailyMatches: number;
    superLikes: number;
    rewinds: number;
    boosts: number;
  };
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Basic matching',
      'Daily check-in rewards',
      'Limited messages',
    ],
    limits: { dailyMatches: 10, superLikes: 1, rewinds: 0, boosts: 0 },
  },
  {
    tier: 'plus',
    name: 'PlayMyDate Plus',
    price: 299,
    priceId: 'price_plus_monthly',
    features: [
      'Unlimited matching',
      'See who likes you',
      '5 Super Likes per day',
      'Rewind last swipe',
      '1 Boost per month',
      'Priority matching',
    ],
    limits: { dailyMatches: -1, superLikes: 5, rewinds: 3, boosts: 1 },
  },
  {
    tier: 'premium',
    name: 'PlayMyDate Premium',
    price: 599,
    priceId: 'price_premium_monthly',
    features: [
      'All Plus features',
      'Unlimited Super Likes',
      'Unlimited Rewinds',
      '5 Boosts per month',
      'See activity status',
      'Top Picks access',
      'Incognito mode',
    ],
    limits: { dailyMatches: -1, superLikes: -1, rewinds: -1, boosts: 5 },
  },
];

export function getSubscriptionPlans(): ServiceResult<SubscriptionPlan[]> {
  return success(SUBSCRIPTION_PLANS);
}

export async function getCurrentSubscription(
  userId: string
): Promise<ServiceResult<UserSubscription>> {
  try {
    const result = await sql`
      SELECT
        id,
        subscription_tier,
        subscription_expires_at
      FROM users
      WHERE id = ${userId}
    `;

    if (result.rows.length === 0) {
      return failure('User not found', 'NOT_FOUND');
    }

    const user = result.rows[0];
    const tier = (user.subscription_tier || 'free') as SubscriptionTier;
    const expiresAt = user.subscription_expires_at;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    return success({
      userId,
      tier: isExpired ? 'free' : tier,
      status: isExpired ? 'expired' : 'active',
      currentPeriodStart: null,
      currentPeriodEnd: expiresAt ? new Date(expiresAt) : null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
  } catch (error) {
    console.error('getCurrentSubscription error:', error);
    return failure('Failed to get subscription', 'INTERNAL_ERROR');
  }
}

export async function upgradeTier(
  userId: string,
  tier: SubscriptionTier
): Promise<ServiceResult<UserSubscription>> {
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
    if (!plan) {
      return failure('Invalid subscription tier', 'INVALID_TIER');
    }

    if (tier === 'free') {
      return failure('Cannot upgrade to free tier', 'INVALID_OPERATION');
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await sql`
      UPDATE users
      SET
        subscription_tier = ${tier},
        subscription_expires_at = ${expiresAt.toISOString()},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    return success({
      userId,
      tier,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: expiresAt,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
  } catch (error) {
    console.error('upgradeTier error:', error);
    return failure('Failed to upgrade subscription', 'INTERNAL_ERROR');
  }
}

export async function cancelSubscription(
  userId: string
): Promise<ServiceResult<UserSubscription>> {
  try {
    const currentResult = await getCurrentSubscription(userId);
    if (!currentResult.success) {
      return currentResult;
    }

    if (currentResult.data.tier === 'free') {
      return failure('No active subscription to cancel', 'NO_SUBSCRIPTION');
    }

    return success({
      ...currentResult.data,
      cancelAtPeriodEnd: true,
    });
  } catch (error) {
    console.error('cancelSubscription error:', error);
    return failure('Failed to cancel subscription', 'INTERNAL_ERROR');
  }
}

export async function handleWebhook(
  event: { type: string; data: Record<string, unknown> }
): Promise<ServiceResult<{ handled: boolean }>> {
  try {
    console.log('Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        break;
      case 'customer.subscription.updated':
        break;
      case 'customer.subscription.deleted':
        break;
      case 'invoice.payment_succeeded':
        break;
      case 'invoice.payment_failed':
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return success({ handled: true });
  } catch (error) {
    console.error('handleWebhook error:', error);
    return failure('Failed to handle webhook', 'INTERNAL_ERROR');
  }
}
