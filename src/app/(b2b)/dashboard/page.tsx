'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardOverview, CampaignList } from '@/components/b2b';
import type { Campaign } from '@/lib/services/campaign';
import type { DateVenue } from '@/lib/services/venue';

export default function B2BDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [venues, setVenues] = useState<DateVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, venuesRes] = await Promise.all([
          fetch('/api/b2b/campaigns', { credentials: 'include' }),
          fetch('/api/b2b/venues', { credentials: 'include' }),
        ]);

        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json();
          setCampaigns(campaignsData.campaigns || []);
        }

        if (venuesRes.ok) {
          const venuesData = await venuesRes.json();
          setVenues(venuesData.venues || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="skeleton h-9 w-40" />
          <div className="skeleton h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your business performance
        </p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <DashboardOverview campaigns={campaigns} venueCount={venues.length} />
      </div>

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Recent Campaigns</h2>
          <Link href="/b2b/campaigns">
            <button className="btn-secondary text-sm">
              View All
            </button>
          </Link>
        </div>

        <CampaignList campaigns={recentCampaigns} />

        {campaigns.length === 0 && (
          <div className="card text-center py-12 animate-bounce-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first campaign to start reaching customers
            </p>
            <Link href="/b2b/campaigns">
              <button className="btn-primary">Create Your First Campaign</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
