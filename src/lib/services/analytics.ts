import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface MerchantOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpent: number;
  avgCTR: number;
  avgConversionRate: number;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  spent: number;
  cpa: number;
}

export interface ConversionFunnel {
  impressions: number;
  clicks: number;
  engagements: number;
  conversions: number;
  dropoffRates: {
    impressionToClick: number;
    clickToEngagement: number;
    engagementToConversion: number;
  };
}

export interface AudienceInsight {
  segment: string;
  count: number;
  percentage: number;
  avgEngagement: number;
}

export interface AnalyticsReport {
  id: string;
  merchant_id: string;
  report_type: string;
  config: Record<string, unknown> | null;
  data: Record<string, unknown> | null;
  status: string;
  generated_at: Date | null;
  created_at: Date;
}

export type ReportPeriod = '7d' | '30d' | '90d' | 'all';

export async function getMerchantOverview(
  merchantId: string,
  period: ReportPeriod = '30d'
): Promise<ServiceResult<MerchantOverview>> {
  try {
    const periodFilter = getPeriodFilter(period);

    const campaignResult = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        SUM(COALESCE(spent::numeric, 0)) as total_spent
      FROM campaigns
      WHERE merchant_id = ${merchantId}
    `;

    const metricsResult = await sql.query(`
      SELECT
        SUM(COALESCE((metrics->>'impressions')::int, 0)) as impressions,
        SUM(COALESCE((metrics->>'clicks')::int, 0)) as clicks,
        SUM(COALESCE((metrics->>'conversions')::int, 0)) as conversions
      FROM campaigns
      WHERE merchant_id = $1 ${periodFilter ? `AND created_at >= NOW() - INTERVAL '${periodFilter}'` : ''}
    `, [merchantId]);

    const campaigns = campaignResult.rows[0];
    const metrics = metricsResult.rows[0];

    const impressions = parseInt(metrics.impressions || '0', 10);
    const clicks = parseInt(metrics.clicks || '0', 10);
    const conversions = parseInt(metrics.conversions || '0', 10);

    return success({
      totalCampaigns: parseInt(campaigns.total || '0', 10),
      activeCampaigns: parseInt(campaigns.active || '0', 10),
      totalImpressions: impressions,
      totalClicks: clicks,
      totalConversions: conversions,
      totalSpent: parseFloat(campaigns.total_spent || '0'),
      avgCTR: impressions > 0 ? (clicks / impressions) * 100 : 0,
      avgConversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    });
  } catch (error) {
    console.error('getMerchantOverview error:', error);
    return failure('Failed to get merchant overview', 'INTERNAL_ERROR');
  }
}

export async function getCampaignPerformance(campaignId: string): Promise<ServiceResult<CampaignPerformance>> {
  try {
    const result = await sql`
      SELECT id, name, spent, metrics
      FROM campaigns
      WHERE id = ${campaignId}
    `;

    if (result.rows.length === 0) {
      return failure('Campaign not found', 'NOT_FOUND');
    }

    const campaign = result.rows[0];
    const metrics = (campaign.metrics || {}) as Record<string, number>;

    const impressions = metrics.impressions || 0;
    const clicks = metrics.clicks || 0;
    const conversions = metrics.conversions || 0;
    const spent = parseFloat(campaign.spent || '0');

    return success({
      campaignId: campaign.id,
      name: campaign.name,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      spent,
      cpa: conversions > 0 ? spent / conversions : 0,
    });
  } catch (error) {
    console.error('getCampaignPerformance error:', error);
    return failure('Failed to get campaign performance', 'INTERNAL_ERROR');
  }
}

export async function getConversionFunnel(campaignId: string): Promise<ServiceResult<ConversionFunnel>> {
  try {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
        COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
        COUNT(*) FILTER (WHERE event_type = 'engagement') as engagements,
        COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions
      FROM campaign_events
      WHERE campaign_id = ${campaignId}
    `;

    const data = result.rows[0];
    const impressions = parseInt(data.impressions || '0', 10);
    const clicks = parseInt(data.clicks || '0', 10);
    const engagements = parseInt(data.engagements || '0', 10);
    const conversions = parseInt(data.conversions || '0', 10);

    return success({
      impressions,
      clicks,
      engagements,
      conversions,
      dropoffRates: {
        impressionToClick: impressions > 0 ? ((impressions - clicks) / impressions) * 100 : 0,
        clickToEngagement: clicks > 0 ? ((clicks - engagements) / clicks) * 100 : 0,
        engagementToConversion: engagements > 0 ? ((engagements - conversions) / engagements) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('getConversionFunnel error:', error);
    return failure('Failed to get conversion funnel', 'INTERNAL_ERROR');
  }
}

export async function getAudienceInsights(
  merchantId: string,
  filters: { segment?: string } = {}
): Promise<ServiceResult<AudienceInsight[]>> {
  try {
    const result = await sql`
      SELECT
        COALESCE(ubp.persona_type, 'unknown') as segment,
        COUNT(DISTINCT ce.user_id) as count,
        AVG(COALESCE(ubp.engagement_score::numeric, 0)) as avg_engagement
      FROM campaign_events ce
      JOIN campaigns c ON ce.campaign_id = c.id
      LEFT JOIN user_behavioral_profiles ubp ON ce.user_id = ubp.user_id
      WHERE c.merchant_id = ${merchantId}
        AND ce.user_id IS NOT NULL
      GROUP BY ubp.persona_type
      ORDER BY count DESC
    `;

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

    const insights: AudienceInsight[] = result.rows.map(row => ({
      segment: row.segment,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? (parseInt(row.count, 10) / total) * 100 : 0,
      avgEngagement: parseFloat(row.avg_engagement || '0'),
    }));

    return success(insights);
  } catch (error) {
    console.error('getAudienceInsights error:', error);
    return failure('Failed to get audience insights', 'INTERNAL_ERROR');
  }
}

export async function generateReport(
  merchantId: string,
  config: { type: string; period?: ReportPeriod; campaignIds?: string[] }
): Promise<ServiceResult<AnalyticsReport>> {
  try {
    const reportResult = await sql`
      INSERT INTO analytics_reports (merchant_id, report_type, config, status)
      VALUES (${merchantId}, ${config.type}, ${JSON.stringify(config)}::jsonb, 'processing')
      RETURNING *
    `;

    const report = reportResult.rows[0] as AnalyticsReport;

    let reportData: Record<string, unknown> = {};

    switch (config.type) {
      case 'overview':
        const overviewResult = await getMerchantOverview(merchantId, config.period || '30d');
        if (overviewResult.success) {
          reportData = overviewResult.data as unknown as Record<string, unknown>;
        }
        break;
      case 'audience':
        const audienceResult = await getAudienceInsights(merchantId);
        if (audienceResult.success) {
          reportData = { segments: audienceResult.data };
        }
        break;
      case 'campaigns':
        if (config.campaignIds) {
          const performances = [];
          for (const campaignId of config.campaignIds) {
            const perfResult = await getCampaignPerformance(campaignId);
            if (perfResult.success) {
              performances.push(perfResult.data);
            }
          }
          reportData = { campaigns: performances };
        }
        break;
    }

    const updatedReport = await sql`
      UPDATE analytics_reports
      SET data = ${JSON.stringify(reportData)}::jsonb, status = 'completed', generated_at = NOW()
      WHERE id = ${report.id}
      RETURNING *
    `;

    return success(updatedReport.rows[0] as AnalyticsReport);
  } catch (error) {
    console.error('generateReport error:', error);
    return failure('Failed to generate report', 'INTERNAL_ERROR');
  }
}

export async function getReportById(
  reportId: string,
  merchantId: string
): Promise<ServiceResult<AnalyticsReport>> {
  try {
    const result = await sql`
      SELECT * FROM analytics_reports
      WHERE id = ${reportId} AND merchant_id = ${merchantId}
    `;

    if (result.rows.length === 0) {
      return failure('Report not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as AnalyticsReport);
  } catch (error) {
    console.error('getReportById error:', error);
    return failure('Failed to get report', 'INTERNAL_ERROR');
  }
}

function getPeriodFilter(period: ReportPeriod): string {
  switch (period) {
    case '7d': return '7 days';
    case '30d': return '30 days';
    case '90d': return '90 days';
    case 'all': return '';
    default: return '30 days';
  }
}
