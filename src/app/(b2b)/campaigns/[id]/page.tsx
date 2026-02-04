'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConversionFunnel, MetricCard } from '@/components/b2b';
import type { Campaign } from '@/lib/services/campaign';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [performance, setPerformance] = useState<{
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
    spent: number;
    cpa: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [campaignRes, analyticsRes] = await Promise.all([
          fetch(`/api/b2b/campaigns/${id}`, { credentials: 'include' }),
          fetch(`/api/b2b/analytics/campaigns/${id}`, { credentials: 'include' }),
        ]);

        if (campaignRes.ok) {
          const data = await campaignRes.json();
          setCampaign(data.campaign);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setPerformance(data.performance);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
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

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-muted-foreground">{campaign.type}</p>
          {campaign.description && (
            <p className="text-sm mt-2">{campaign.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/campaigns/${id}/edit`)}>
            Edit
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="Spent"
            value={`฿${performance.spent.toLocaleString()}`}
            description={`฿${performance.cpa.toFixed(2)} CPA`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel campaignId={id} />

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-medium">฿{parseFloat(campaign.budget || '0').toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Spent</p>
                <p className="font-medium">฿{parseFloat(campaign.spent || '0').toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
