'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from './MetricCard';

interface BillingSummary {
  totalInvoices: number;
  totalAmount: number;
  pendingAmount: number;
}

interface UsageSummary {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpent: number;
  totalBudget: number;
}

export function BillingOverview() {
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [billingRes, usageRes] = await Promise.all([
          fetch('/api/b2b/billing/invoices'),
          fetch('/api/b2b/billing/usage'),
        ]);

        if (billingRes.ok) {
          const data = await billingRes.json();
          setBilling(data.summary);
        }

        if (usageRes.ok) {
          const data = await usageRes.json();
          setUsage(data.summary);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Invoices"
          value={billing?.totalInvoices || 0}
          description="All time"
        />
        <MetricCard
          title="Total Billed"
          value={`฿${(billing?.totalAmount || 0).toLocaleString()}`}
          description="Across all campaigns"
        />
        <MetricCard
          title="Pending"
          value={`฿${(billing?.pendingAmount || 0).toLocaleString()}`}
          description="Active campaigns"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage This Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Impressions</p>
              <p className="text-2xl font-bold">{(usage?.totalImpressions || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clicks</p>
              <p className="text-2xl font-bold">{(usage?.totalClicks || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">{(usage?.totalConversions || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budget Used</p>
              <p className="text-2xl font-bold">
                {usage && usage.totalBudget > 0
                  ? `${((usage.totalSpent / usage.totalBudget) * 100).toFixed(0)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
