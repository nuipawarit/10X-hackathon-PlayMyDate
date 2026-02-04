'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AudienceInsight } from '@/lib/services/analytics';

export function AudienceInsights() {
  const [insights, setInsights] = useState<AudienceInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/b2b/analytics/audience');
        if (res.ok) {
          const json = await res.json();
          setInsights(json.insights || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getPersonaBadgeColor = (persona: string) => {
    switch (persona) {
      case 'explorer':
        return 'bg-blue-500';
      case 'connector':
        return 'bg-pink-500';
      case 'achiever':
        return 'bg-yellow-500';
      case 'premium':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audience Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audience Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No audience data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.segment} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getPersonaBadgeColor(insight.segment)}>
                    {insight.segment.charAt(0).toUpperCase() + insight.segment.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {insight.count.toLocaleString()} users
                  </span>
                </div>
                <span className="text-sm font-medium">{insight.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getPersonaBadgeColor(insight.segment)} transition-all duration-500`}
                  style={{ width: `${insight.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Avg. Engagement Score: {insight.avgEngagement.toFixed(1)}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Persona Definitions</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div><Badge className="bg-blue-500 mr-1">Explorer</Badge> Diverse activities</div>
            <div><Badge className="bg-pink-500 mr-1">Connector</Badge> High messaging</div>
            <div><Badge className="bg-yellow-500 mr-1">Achiever</Badge> Long streaks</div>
            <div><Badge className="bg-gray-500 mr-1">Casual</Badge> Light engagement</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
