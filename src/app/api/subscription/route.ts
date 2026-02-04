import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { getCurrentSubscription, getSubscriptionPlans } from '@/lib/services/subscription';

export async function GET() {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [subscriptionResult, plansResult] = await Promise.all([
    getCurrentSubscription(user.id),
    Promise.resolve(getSubscriptionPlans()),
  ]);

  if (!subscriptionResult.success) {
    return NextResponse.json({ error: subscriptionResult.error }, { status: 500 });
  }

  return NextResponse.json({
    subscription: subscriptionResult.data,
    plans: plansResult.success ? plansResult.data : [],
  });
}
