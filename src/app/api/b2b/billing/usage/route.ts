import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    try {
      const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;

      const usageResult = await sql`
        SELECT
          c.id as campaign_id,
          c.name as campaign_name,
          COALESCE((c.metrics->>'impressions')::int, 0) as impressions,
          COALESCE((c.metrics->>'clicks')::int, 0) as clicks,
          COALESCE((c.metrics->>'conversions')::int, 0) as conversions,
          COALESCE(c.spent::numeric, 0) as spent,
          COALESCE(c.budget::numeric, 0) as budget
        FROM campaigns c
        WHERE c.merchant_id = ${merchantId}
          AND c.created_at >= NOW() - INTERVAL '1 day' * ${periodDays}
        ORDER BY c.created_at DESC
      `;

      const totalResult = await sql`
        SELECT
          SUM(COALESCE((metrics->>'impressions')::int, 0)) as total_impressions,
          SUM(COALESCE((metrics->>'clicks')::int, 0)) as total_clicks,
          SUM(COALESCE((metrics->>'conversions')::int, 0)) as total_conversions,
          SUM(COALESCE(spent::numeric, 0)) as total_spent,
          SUM(COALESCE(budget::numeric, 0)) as total_budget
        FROM campaigns
        WHERE merchant_id = ${merchantId}
          AND created_at >= NOW() - INTERVAL '1 day' * ${periodDays}
      `;

      const questResult = await sql`
        SELECT COUNT(*) as total_quests
        FROM branded_quests bq
        JOIN campaigns c ON bq.campaign_id = c.id
        WHERE c.merchant_id = ${merchantId}
      `;

      const campaignUsage = usageResult.rows.map(row => ({
        campaignId: row.campaign_id,
        campaignName: row.campaign_name,
        impressions: row.impressions,
        clicks: row.clicks,
        conversions: row.conversions,
        spent: parseFloat(row.spent),
        budget: parseFloat(row.budget),
        budgetUsed: row.budget > 0 ? (parseFloat(row.spent) / parseFloat(row.budget)) * 100 : 0,
      }));

      const totals = totalResult.rows[0] || {};

      return NextResponse.json({
        period,
        usage: campaignUsage,
        summary: {
          totalImpressions: parseInt(totals.total_impressions || '0'),
          totalClicks: parseInt(totals.total_clicks || '0'),
          totalConversions: parseInt(totals.total_conversions || '0'),
          totalSpent: parseFloat(totals.total_spent || '0'),
          totalBudget: parseFloat(totals.total_budget || '0'),
          totalQuests: parseInt(questResult.rows[0]?.total_quests || '0'),
        },
      });
    } catch (error) {
      console.error('GET usage error:', error);
      return NextResponse.json({ error: 'Failed to get usage data' }, { status: 500 });
    }
  });
}
