'use client';

import Link from 'next/link';
import { WalletBalance, TransactionHistory, DailyCheckin } from '@/components/wallet';
import { ReferralCard } from '@/components/referral';
import { Button } from '@/components/ui/button';

export default function WalletPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Wallet</h1>
        <Link href="/rewards">
          <Button variant="outline">Rewards Shop</Button>
        </Link>
      </div>

      <WalletBalance showLifetime />

      <DailyCheckin />

      <ReferralCard />

      <TransactionHistory />
    </div>
  );
}
