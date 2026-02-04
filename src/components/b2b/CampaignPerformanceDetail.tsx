'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from './MetricCard';
import { ConversionFunnel } from './ConversionFunnel';
import { PerformanceChart, type TimeSeriesData } from './PerformanceChart';

interface CampaignPerformanceDetailProps {
  campaignId: string;
}

interface PerformanceData {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  spent: number;
  cpa: number;
}

export function CampaignPerformanceDetail({ campaignId }: CampaignPerformanceDetailProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [perfRes, tsRes] = await Promise.all([
          fetch(`/api/b2b/analytics/campaigns/${campaignId}?period=${period}`, { credentials: 'include' }),
          fetch(`/api/b2b/analytics/campaigns/${campaignId}/timeseries?period=${period}`, { credentials: 'include' }),
        ]);

        if (perfRes.ok) {
          const data = await perfRes.json();
          setPerformance(data.performance);
        }

        if (tsRes.ok) {
          const data = await tsRes.json();
          setTimeSeries(data.timeSeries || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignId, period]);

  const calculateROI = () => {
    if (!performance || performance.spent === 0) return 0;
    const estimatedRevenue = performance.conversions * 100;
    return ((estimatedRevenue - performance.spent) / performance.spent * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance Analytics</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {performance && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Impressions"
              value={performance.impressions.toLocaleString()}
            />
            <MetricCard
              title="Clicks"
              value={performance.clicks.toLocaleString()}
              description={`${performance.ctr.toFixed(2)}% CTR`}
            />
            <MetricCard
              title="Conversions"
              value={performance.conversions.toLocaleString()}
              description={`${performance.conversionRate.toFixed(2)}% rate`}
            />
            <MetricCard
              title="Total Spent"
              value={`฿${performance.spent.toLocaleString()}`}
              description={`฿${performance.cpa.toFixed(2)} CPA`}
            />
            <MetricCard
              title="Est. ROI"
              value={`${calculateROI().toFixed(1)}%`}
              description="Based on avg. conversion value"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart data={timeSeries} />
            <ConversionFunnel campaignId={campaignId} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((performance.clicks / Math.max(performance.impressions, 1)) * 100).toFixed(2)}%
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((performance.clicks / Math.max(performance.impressions, 1)) * 100 * 10, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((performance.conversions / Math.max(performance.clicks, 1)) * 100).toFixed(2)}%
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((performance.conversions / Math.max(performance.clicks, 1)) * 100 * 5, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cost Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ฿{(performance.spent / Math.max(performance.conversions, 1)).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cost per conversion</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
