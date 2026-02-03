import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getRewardCatalog } from '@/lib/services/reward';

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const maxCost = searchParams.get('maxCost')
      ? parseInt(searchParams.get('maxCost')!, 10)
      : undefined;

    const result = await getRewardCatalog({ type, maxCost });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ rewards: result.data });
  });
}
