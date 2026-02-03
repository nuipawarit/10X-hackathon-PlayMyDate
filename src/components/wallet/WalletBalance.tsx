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
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">PlayCoin Balance</p>
            <p className="text-3xl font-bold text-yellow-600">
              🪙 {wallet.balance.toLocaleString()}
            </p>
          </div>
          {showLifetime && (
            <div className="text-right text-sm text-muted-foreground">
              <p>Lifetime Earned: {wallet.lifetime_earned.toLocaleString()}</p>
              <p>Lifetime Spent: {wallet.lifetime_spent.toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
