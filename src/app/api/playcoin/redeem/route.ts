import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { redeemReward } from '@/lib/services/reward';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: 'rewardId is required' }, { status: 400 });
    }

    const result = await redeemReward(userId, rewardId);

    if (!result.success) {
      const status =
        result.code === 'INSUFFICIENT_BALANCE' ||
        result.code === 'OUT_OF_STOCK' ||
        result.code === 'REWARD_UNAVAILABLE'
          ? 400
          : result.code === 'NOT_FOUND'
            ? 404
            : 500;

      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  });
}
