'use client';

import { MetricCard } from './MetricCard';
import type { Campaign } from '@/lib/services/campaign';

interface DashboardOverviewProps {
  campaigns: Campaign[];
  venueCount: number;
}

export function DashboardOverview({ campaigns, venueCount }: DashboardOverviewProps) {
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalBudget = campaigns.reduce(
    (sum, c) => sum + (parseFloat(c.budget || '0') || 0),
    0
  );
  const totalSpent = campaigns.reduce(
    (sum, c) => sum + (parseFloat(c.spent || '0') || 0),
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Active Campaigns"
        value={activeCampaigns}
        description={`of ${campaigns.length} total campaigns`}
        icon={<span>📊</span>}
      />
      <MetricCard
        title="Total Venues"
        value={venueCount}
        description="registered venues"
        icon={<span>📍</span>}
      />
      <MetricCard
        title="Total Budget"
        value={`฿${totalBudget.toLocaleString()}`}
        description="across all campaigns"
        icon={<span>💰</span>}
      />
      <MetricCard
        title="Total Spent"
        value={`฿${totalSpent.toLocaleString()}`}
        description={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget`}
        icon={<span>📈</span>}
      />
    </div>
  );
}
