import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getMerchantOverview, type ReportPeriod } from '@/lib/services/analytics';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '30d') as ReportPeriod;

    const result = await getMerchantOverview(merchantId, period);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  });
}
