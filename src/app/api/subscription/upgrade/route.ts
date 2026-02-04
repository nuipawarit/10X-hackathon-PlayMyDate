import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { upgradeTier, type SubscriptionTier } from '@/lib/services/subscription';

export async function POST(request: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.tier) {
    return NextResponse.json({ error: 'tier is required' }, { status: 400 });
  }

  const validTiers: SubscriptionTier[] = ['plus', 'premium'];
  if (!validTiers.includes(body.tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const result = await upgradeTier(user.id, body.tier);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    subscription: result.data,
    message: `Successfully upgraded to ${body.tier}`,
  });
}
