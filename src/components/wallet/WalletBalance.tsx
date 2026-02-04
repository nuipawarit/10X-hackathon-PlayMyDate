'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getWallet, type Wallet } from '@/lib/api';

interface WalletBalanceProps {
  compact?: boolean;
  showLifetime?: boolean;
}

export default function WalletBalance({ compact = false, showLifetime = false }: WalletBalanceProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const { data } = await getWallet();
        setWallet(data);
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) {
    return compact ? (
      <span className="text-sm text-muted-foreground">Loading...</span>
    ) : (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm font-medium">
        <span className="text-yellow-500">🪙</span>
        <span>{wallet.balance.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div className="wallet-card rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-amber-700/70 mb-1">PlayCoin Balance</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🪙</span>
            <span className="coin-amount">{wallet.balance.toLocaleString()}</span>
          </div>
        </div>
        {showLifetime && (
          <div className="text-right space-y-1">
            <p className="text-sm font-medium text-amber-700/70">
              <span className="text-green-600">↑</span> Earned: {wallet.lifetime_earned.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-amber-700/70">
              <span className="text-rose-500">↓</span> Spent: {wallet.lifetime_spent.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
