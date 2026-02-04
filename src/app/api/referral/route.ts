import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getReferralStats } from '@/lib/services/referral';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const result = await getReferralStats(userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  });
}
