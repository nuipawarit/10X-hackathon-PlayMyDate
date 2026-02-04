'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="space-y-6">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="card text-center py-16 animate-bounce-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Campaign not found</h3>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">{campaign.name}</h1>
          <p className="text-gray-500 mt-1">Performance Analytics</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => router.push(`/b2b/campaigns/${id}`)}>
            Overview
          </button>
          <button className="btn-secondary" onClick={() => router.push('/b2b/campaigns')}>
            All Campaigns
          </button>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CampaignPerformanceDetail campaignId={id} />
      </div>
    </div>
  );
}
