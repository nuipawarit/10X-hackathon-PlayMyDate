'use client';

import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import type { Campaign } from '@/lib/services/campaign';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const budget = parseFloat(campaign.budget || '0') || 0;
  const spent = parseFloat(campaign.spent || '0') || 0;
  const progress = budget > 0 ? (spent / budget) * 100 : 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-600',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <Link href={`/b2b/campaigns/${campaign.id}`}>
      <div className="card-hover">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{campaign.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{campaign.type}</p>
          </div>
          {getStatusBadge(campaign.status)}
        </div>
        <div className="space-y-4">
          {campaign.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {campaign.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Budget Used</span>
              <span className="text-gray-700">
                ฿{spent.toLocaleString()} / ฿{budget.toLocaleString()}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex justify-between text-xs text-gray-400">
            {campaign.start_date && (
              <span>
                Start: {new Date(campaign.start_date).toLocaleDateString()}
              </span>
            )}
            {campaign.end_date && (
              <span>
                End: {new Date(campaign.end_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
