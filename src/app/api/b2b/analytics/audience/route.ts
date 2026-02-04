import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getAudienceInsights } from '@/lib/services/analytics';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment') || undefined;

    const result = await getAudienceInsights(merchantId, { segment });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ insights: result.data });
  });
}
