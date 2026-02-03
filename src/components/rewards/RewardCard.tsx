'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Reward } from '@/lib/api';

interface RewardCardProps {
  reward: Reward;
  userBalance: number;
  onRedeem: (rewardId: string) => void;
  redeeming?: boolean;
}

export default function RewardCard({ reward, userBalance, onRedeem, redeeming }: RewardCardProps) {
  const canAfford = userBalance >= reward.coin_cost;
  const isOutOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      powerup: '⚡',
      avatar_item: '👤',
      voucher: '🎫',
      partner_exchange: '🤝',
    };
    return icons[type] || '🎁';
  };

  const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      powerup: 'default',
      avatar_item: 'secondary',
      voucher: 'destructive',
      partner_exchange: 'outline',
    };
    return variants[type] || 'default';
  };

  return (
    <Card className={`${!canAfford || isOutOfStock ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{getTypeIcon(reward.type)}</span>
          <Badge variant={getTypeBadgeVariant(reward.type)} className="capitalize">
            {reward.type.replace('_', ' ')}
          </Badge>
        </div>
        <h3 className="font-semibold mb-1">{reward.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-yellow-600">
            🪙 {reward.coin_cost.toLocaleString()}
          </span>
          {reward.stock_quantity !== null && (
            <span className="text-xs text-muted-foreground">
              {isOutOfStock ? 'Out of stock' : `${reward.stock_quantity} left`}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onRedeem(reward.id)}
          disabled={!canAfford || isOutOfStock || redeeming}
          className="w-full"
          variant={canAfford && !isOutOfStock ? 'default' : 'outline'}
        >
          {redeeming
            ? 'Redeeming...'
            : isOutOfStock
              ? 'Out of Stock'
              : !canAfford
                ? 'Not Enough Coins'
                : 'Redeem'}
        </Button>
      </CardFooter>
    </Card>
  );
}
