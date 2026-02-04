'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AnalyticsDashboard,
  AudienceInsights,
  ReportBuilder,
} from '@/components/b2b';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your campaign performance and audience insights
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 px-3 border rounded-md"
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d')}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AnalyticsDashboard period={period} />
        </TabsContent>

        <TabsContent value="audience">
          <AudienceInsights />
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportBuilder />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recent Reports</h3>
              <p className="text-sm text-muted-foreground">
                Generated reports will appear here
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
