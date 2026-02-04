'use client';

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

  const getTypeBadgeStyle = (type: string) => {
    const styles: Record<string, string> = {
      powerup: 'bg-purple-100 text-purple-700',
      avatar_item: 'bg-blue-100 text-blue-700',
      voucher: 'bg-rose-100 text-rose-700',
      partner_exchange: 'bg-orange-100 text-orange-700',
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`card-hover ${!canAfford || isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{getTypeIcon(reward.type)}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getTypeBadgeStyle(reward.type)}`}>
          {reward.type.replace('_', ' ')}
        </span>
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{reward.name}</h3>
      <p className="text-sm text-gray-500 mb-3">{reward.description}</p>
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-amber-600">
          🪙 {reward.coin_cost.toLocaleString()}
        </span>
        {reward.stock_quantity !== null && (
          <span className="text-xs text-gray-400">
            {isOutOfStock ? 'Out of stock' : `${reward.stock_quantity} left`}
          </span>
        )}
      </div>
      <button
        onClick={() => onRedeem(reward.id)}
        disabled={!canAfford || isOutOfStock || redeeming}
        className={`w-full ${canAfford && !isOutOfStock ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
      >
        {redeeming
          ? 'Redeeming...'
          : isOutOfStock
            ? 'Out of Stock'
            : !canAfford
              ? 'Not Enough Coins'
              : 'Redeem'}
      </button>
    </div>
  );
}
