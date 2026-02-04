'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConversionFunnel as FunnelData } from '@/lib/services/analytics';

interface ConversionFunnelProps {
  campaignId: string;
}

export function ConversionFunnel({ campaignId }: ConversionFunnelProps) {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/b2b/analytics/conversions?campaignId=${campaignId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No funnel data available</p>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { name: 'Impressions', value: data.impressions, dropoff: null },
    { name: 'Clicks', value: data.clicks, dropoff: data.dropoffRates.impressionToClick },
    { name: 'Engagements', value: data.engagements, dropoff: data.dropoffRates.clickToEngagement },
    { name: 'Conversions', value: data.conversions, dropoff: data.dropoffRates.engagementToConversion },
  ];

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercent = (stage.value / maxValue) * 100;

          return (
            <div key={stage.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span>{stage.value.toLocaleString()}</span>
              </div>
              <div className="h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    opacity: 1 - index * 0.15,
                  }}
                />
              </div>
              {stage.dropoff !== null && (
                <p className="text-xs text-muted-foreground">
                  {stage.dropoff.toFixed(1)}% drop-off from previous stage
                </p>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Conversion Rate</span>
            <span className="font-medium">
              {data.impressions > 0
                ? ((data.conversions / data.impressions) * 100).toFixed(2)
                : '0'}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
