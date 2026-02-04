'use client';

import { useEffect, useState } from 'react';
import { getRewards, getWallet, redeemReward, type Reward } from '@/lib/api';
import RewardCard from './RewardCard';
import RedeemConfirmation from './RedeemConfirmation';

export default function RewardCatalog() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rewardsRes, walletRes] = await Promise.all([getRewards(), getWallet()]);
        setRewards(rewardsRes.data);
        setBalance(walletRes.data.balance);
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRedeemClick = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (reward) {
      setSelectedReward(reward);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    setRedeeming(selectedReward.id);
    try {
      await redeemReward(selectedReward.id);
      setBalance((prev) => prev - selectedReward.coin_cost);
      if (selectedReward.stock_quantity !== null) {
        setRewards((prev) =>
          prev.map((r) =>
            r.id === selectedReward.id && r.stock_quantity !== null
              ? { ...r, stock_quantity: r.stock_quantity - 1 }
              : r
          )
        );
      }
      setSelectedReward(null);
    } catch (error) {
      console.error('Failed to redeem reward:', error);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-48 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward, index) => (
          <div key={reward.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
            <RewardCard
              reward={reward}
              userBalance={balance}
              onRedeem={handleRedeemClick}
              redeeming={redeeming === reward.id}
            />
          </div>
        ))}
      </div>

      {selectedReward && (
        <RedeemConfirmation
          reward={selectedReward}
          userBalance={balance}
          open={!!selectedReward}
          onOpenChange={(open) => !open && setSelectedReward(null)}
          onConfirm={handleConfirmRedeem}
          loading={!!redeeming}
        />
      )}
    </>
  );
}
