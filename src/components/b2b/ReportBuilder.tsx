'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ReportBuilderProps {
  onGenerate?: (reportId: string) => void;
}

const REPORT_TYPES = [
  { value: 'overview', label: 'Overview Report', description: 'Summary of all metrics' },
  { value: 'campaigns', label: 'Campaign Performance', description: 'Detailed campaign analytics' },
  { value: 'conversions', label: 'Conversions Report', description: 'Booking and action tracking' },
  { value: 'audience', label: 'Audience Analysis', description: 'User demographics and behavior' },
  { value: 'billing', label: 'Billing Report', description: 'Spend and invoice summary' },
  { value: 'quests', label: 'Quests Report', description: 'Quest completion analytics' },
];

const PRESET_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

export function ReportBuilder({ onGenerate }: ReportBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('overview');
  const [period, setPeriod] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'html'>('csv');
  const [generatedReport, setGeneratedReport] = useState<{
    id: string;
    status: string;
    type: string;
  } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload: Record<string, string> = { type: reportType };

      if (period === 'custom') {
        payload.startDate = customStart;
        payload.endDate = customEnd;
      } else {
        payload.period = period;
      }

      const res = await fetch('/api/b2b/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedReport({
          id: data.report.id,
          status: data.report.status,
          type: reportType,
        });
        onGenerate?.(data.report.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'csv' | 'html') => {
    if (!generatedReport) return;
    window.open(
      `/api/b2b/analytics/reports/${generatedReport.id}/download?format=${format}`,
      '_blank'
    );
  };

  const selectedReportType = REPORT_TYPES.find((t) => t.value === reportType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>Create custom analytics reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Report Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setReportType(type.value)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  reportType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Time Period</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  period === p.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="customStart">Start Date</Label>
                <Input
                  id="customStart"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customEnd">End Date</Label>
                <Input
                  id="customEnd"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Export Format</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                exportFormat === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              CSV (Spreadsheet)
            </button>
            <button
              type="button"
              onClick={() => setExportFormat('html')}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                exportFormat === 'html'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              HTML (Web Page)
            </button>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-1">Report Preview</p>
          <p className="text-sm text-muted-foreground">
            {selectedReportType?.label} for {PRESET_PERIODS.find((p) => p.value === period)?.label || 'custom period'}
            {period === 'custom' && customStart && customEnd && (
              <span> ({customStart} to {customEnd})</span>
            )}
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || (period === 'custom' && (!customStart || !customEnd))}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>

        {generatedReport && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium text-green-800 dark:text-green-200">Report Ready</p>
              <Badge variant="secondary" className="ml-auto">
                {REPORT_TYPES.find((t) => t.value === generatedReport.type)?.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">ID: {generatedReport.id}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('csv')}
              >
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('html')}
              >
                Download HTML
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
