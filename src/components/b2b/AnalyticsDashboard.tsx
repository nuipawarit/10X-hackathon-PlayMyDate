'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from './MetricCard';
import type { MerchantOverview } from '@/lib/services/analytics';

interface AnalyticsDashboardProps {
  period?: '7d' | '30d' | '90d';
}

export function AnalyticsDashboard({ period = '30d' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<MerchantOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/b2b/analytics/overview?period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Campaigns"
          value={data.totalCampaigns}
          description={`${data.activeCampaigns} active`}
        />
        <MetricCard
          title="Total Impressions"
          value={data.totalImpressions.toLocaleString()}
          description="All campaigns"
        />
        <MetricCard
          title="Total Clicks"
          value={data.totalClicks.toLocaleString()}
          description={`${data.avgCTR.toFixed(2)}% CTR`}
        />
        <MetricCard
          title="Total Conversions"
          value={data.totalConversions.toLocaleString()}
          description={`${data.avgConversionRate.toFixed(2)}% rate`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">฿{data.totalSpent.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total spent this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Click-through Rate</span>
              <span className="font-medium">{data.avgCTR.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversion Rate</span>
              <span className="font-medium">{data.avgConversionRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost per Conversion</span>
              <span className="font-medium">
                ฿{data.totalConversions > 0 ? (data.totalSpent / data.totalConversions).toFixed(2) : '0'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
