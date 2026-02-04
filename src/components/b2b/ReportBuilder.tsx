'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ReportBuilderProps {
  onGenerate?: (reportId: string) => void;
}

export function ReportBuilder({ onGenerate }: ReportBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('overview');
  const [period, setPeriod] = useState('30d');
  const [generatedReport, setGeneratedReport] = useState<{
    id: string;
    status: string;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/b2b/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, period }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedReport({
          id: data.report.id,
          status: data.report.status,
        });
        onGenerate?.(data.report.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reportType">Report Type</Label>
          <select
            id="reportType"
            className="w-full h-10 px-3 border rounded-md"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="overview">Overview Report</option>
            <option value="campaigns">Campaign Performance</option>
            <option value="audience">Audience Analysis</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Time Period</Label>
          <select
            id="period"
            className="w-full h-10 px-3 border rounded-md"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>

        {generatedReport && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Report Generated</p>
            <p className="text-xs text-muted-foreground">ID: {generatedReport.id}</p>
            <p className="text-xs text-muted-foreground">Status: {generatedReport.status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
