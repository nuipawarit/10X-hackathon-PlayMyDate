import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getCampaignPerformance, getConversionFunnel } from '@/lib/services/analytics';
import { getCampaignEvents } from '@/lib/services/tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async () => {
    const { id: campaignId } = await params;

    const [performanceResult, funnelResult, eventsResult] = await Promise.all([
      getCampaignPerformance(campaignId),
      getConversionFunnel(campaignId),
      getCampaignEvents(campaignId, {}, { limit: 100, offset: 0 }),
    ]);

    if (!performanceResult.success) {
      return NextResponse.json({ error: performanceResult.error }, { status: 500 });
    }

    return NextResponse.json({
      performance: performanceResult.data,
      funnel: funnelResult.success ? funnelResult.data : null,
      recentEvents: eventsResult.success ? eventsResult.data.events : [],
    });
  });
}
