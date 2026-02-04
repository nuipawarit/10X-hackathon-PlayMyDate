'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance
        </p>
      </div>

      <DashboardOverview campaigns={campaigns} venueCount={venues.length} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Campaigns</h2>
          <Link href="/b2b/campaigns">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>

        <CampaignList campaigns={recentCampaigns} />

        {campaigns.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't created any campaigns yet
            </p>
            <Link href="/b2b/campaigns">
              <Button>Create Your First Campaign</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
