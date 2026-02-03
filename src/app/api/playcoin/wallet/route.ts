import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getWallet } from '@/lib/services/playcoin';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const result = await getWallet(userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ wallet: result.data });
  });
}
