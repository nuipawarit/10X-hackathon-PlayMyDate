import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { cancelSubscription } from '@/lib/services/subscription';

export async function POST() {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await cancelSubscription(user.id);

  if (!result.success) {
    const status = result.code === 'NO_SUBSCRIPTION' ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    subscription: result.data,
    message: 'Subscription will be cancelled at the end of the current period',
  });
}
