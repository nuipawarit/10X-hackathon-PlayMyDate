import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { generateReport, type ReportPeriod } from '@/lib/services/analytics';

export async function POST(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const body = await request.json();

    if (!body.type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    const result = await generateReport(merchantId, {
      type: body.type,
      period: body.period as ReportPeriod,
      campaignIds: body.campaignIds,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ report: result.data }, { status: 201 });
  });
}
