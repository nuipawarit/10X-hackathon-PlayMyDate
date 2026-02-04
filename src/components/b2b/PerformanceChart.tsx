'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface PerformanceChartProps {
  data: TimeSeriesData[];
  title?: string;
}

export function PerformanceChart({ data, title = 'Performance Over Time' }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxImpressions = Math.max(...data.map(d => d.impressions), 1);
  const maxClicks = Math.max(...data.map(d => d.clicks), 1);
  const maxConversions = Math.max(...data.map(d => d.conversions), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Impressions</span>
              <span className="font-medium">{data.reduce((sum, d) => sum + d.impressions, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {data.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500 rounded-t min-h-[4px] transition-all hover:bg-blue-600"
                  style={{ height: `${(d.impressions / maxImpressions) * 100}%` }}
                  title={`${d.date}: ${d.impressions.toLocaleString()}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Clicks</span>
              <span className="font-medium">{data.reduce((sum, d) => sum + d.clicks, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {data.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-green-500 rounded-t min-h-[4px] transition-all hover:bg-green-600"
                  style={{ height: `${(d.clicks / maxClicks) * 100}%` }}
                  title={`${d.date}: ${d.clicks.toLocaleString()}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conversions</span>
              <span className="font-medium">{data.reduce((sum, d) => sum + d.conversions, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {data.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-500 rounded-t min-h-[4px] transition-all hover:bg-purple-600"
                  style={{ height: `${(d.conversions / maxConversions) * 100}%` }}
                  title={`${d.date}: ${d.conversions.toLocaleString()}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Impressions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Clicks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span>Conversions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
