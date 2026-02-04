'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuestBuilder } from '@/components/b2b';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-64" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-16 animate-bounce-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Campaigns Yet</h3>
          <p className="text-gray-500 mb-6">
            You need to create a campaign first before creating quests.
          </p>
          <Link href="/b2b/campaigns">
            <button className="btn-primary">Create Campaign</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Create New Quest</h1>
        <p className="text-gray-500 mt-1">
          Create a branded quest for your campaign
        </p>
      </div>

      <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <Label htmlFor="campaign" className="text-gray-700 font-medium">Select Campaign</Label>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Choose a campaign" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCampaign && (
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <QuestBuilder campaignId={selectedCampaign} />
        </div>
      )}
    </div>
  );
}
