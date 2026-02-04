'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AnalyticsDashboard,
  AudienceInsights,
  ReportBuilder,
} from '@/components/b2b';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Track your campaign performance and audience insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Recent Reports</h3>
              <p className="text-sm text-gray-500">
                Generated reports will appear here
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
