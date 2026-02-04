'use client';

import { useState, useEffect } from 'react';
import { QuestBuilder } from '@/components/b2b';
import { Label } from '@/components/ui/label';
import type { Campaign } from '@/lib/services/campaign';

export default function NewQuestPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/b2b/campaigns', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
          if (data.campaigns?.length > 0) {
            setSelectedCampaign(data.campaigns[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">
          You need to create a campaign first before creating quests.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Quest</h1>
        <p className="text-muted-foreground">
          Create a branded quest for your campaign
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign">Select Campaign</Label>
        <select
          id="campaign"
          className="w-full h-10 px-3 border rounded-md"
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
        >
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCampaign && <QuestBuilder campaignId={selectedCampaign} />}
    </div>
  );
}
