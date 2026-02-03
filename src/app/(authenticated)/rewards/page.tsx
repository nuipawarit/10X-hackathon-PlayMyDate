'use client';

import Link from 'next/link';
import { WalletBalance } from '@/components/wallet';
import { RewardCatalog } from '@/components/rewards';
import { Button } from '@/components/ui/button';

export default function RewardsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎁 Rewards Shop</h1>
        <Link href="/wallet">
          <Button variant="outline">🪙 My Wallet</Button>
        </Link>
      </div>

      <WalletBalance />

      <RewardCatalog />
    </div>
  );
}
