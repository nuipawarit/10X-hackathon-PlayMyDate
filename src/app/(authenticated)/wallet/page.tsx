'use client';

import Link from 'next/link';
import { WalletBalance, TransactionHistory, DailyCheckin } from '@/components/wallet';
import { ReferralCard } from '@/components/referral';
import { Button } from '@/components/ui/button';

export default function WalletPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">My Wallet</h1>
          <p className="text-gray-500 mt-1">Earn coins, unlock rewards 🎁</p>
        </div>
        <Link href="/rewards">
          <Button className="btn-accent">🎁 Rewards Shop</Button>
        </Link>
      </div>

      <div className="animate-slide-up-elastic" style={{ animationDelay: '0.1s' }}>
        <WalletBalance showLifetime />
      </div>

      <div className="animate-slide-up-elastic" style={{ animationDelay: '0.15s' }}>
        <DailyCheckin />
      </div>

      <div className="animate-slide-up-elastic" style={{ animationDelay: '0.2s' }}>
        <ReferralCard />
      </div>

      <div className="animate-slide-up-elastic" style={{ animationDelay: '0.25s' }}>
        <TransactionHistory />
      </div>
    </div>
  );
}
