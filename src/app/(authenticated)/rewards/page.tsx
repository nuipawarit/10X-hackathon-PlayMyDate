'use client';

import Link from 'next/link';
import { WalletBalance } from '@/components/wallet';
import { RewardCatalog } from '@/components/rewards';
import { ExchangePartnerCatalog } from '@/components/exchange';

export default function RewardsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Rewards Shop</h1>
          <p className="text-gray-500 mt-1">Redeem your PlayCoins for amazing rewards</p>
        </div>
        <Link href="/wallet">
          <button className="btn-secondary">🪙 My Wallet</button>
        </Link>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <WalletBalance />
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Exchange Partners</h2>
        <ExchangePartnerCatalog />
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Rewards Catalog</h2>
        <RewardCatalog />
      </div>
    </div>
  );
}
