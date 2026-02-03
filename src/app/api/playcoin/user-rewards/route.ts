import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getUserRewards } from '@/lib/services/reward';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'redeemed' | 'used' | 'expired' | null;

    const result = await getUserRewards(userId, status || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ userRewards: result.data });
  });
}
