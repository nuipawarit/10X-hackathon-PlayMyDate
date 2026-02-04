import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async () => {
    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const timeSeries = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const baseImpressions = Math.floor(Math.random() * 500) + 100;
      const baseClicks = Math.floor(baseImpressions * (Math.random() * 0.1 + 0.02));
      const baseConversions = Math.floor(baseClicks * (Math.random() * 0.2 + 0.05));

      timeSeries.push({
        date: dateStr,
        impressions: baseImpressions,
        clicks: baseClicks,
        conversions: baseConversions,
      });
    }

    return NextResponse.json({
      campaignId,
      period,
      timeSeries,
    });
  });
}
