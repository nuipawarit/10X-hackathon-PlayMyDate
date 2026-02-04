'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CampaignPerformanceDetail } from '@/components/b2b/CampaignPerformanceDetail';
import type { Campaign } from '@/lib/services/campaign';

export default function CampaignPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/b2b/campaigns/${id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCampaign(data.campaign);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded" />
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
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">Performance Analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/campaigns/${id}`)}>
            Overview
          </Button>
          <Button variant="outline" onClick={() => router.push('/campaigns')}>
            All Campaigns
          </Button>
        </div>
      </div>

      <CampaignPerformanceDetail campaignId={id} />
    </div>
  );
}
