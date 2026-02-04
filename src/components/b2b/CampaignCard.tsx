'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Link href={`/b2b/campaigns/${campaign.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{campaign.type}</p>
          </div>
          {getStatusBadge(campaign.status)}
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget Used</span>
              <span>
                ฿{spent.toLocaleString()} / ฿{budget.toLocaleString()}
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </Link>
  );
}
