'use client';

import { useEffect, useState } from 'react';
import { ExchangePartnerCard } from './ExchangePartnerCard';
import { getWallet } from '@/lib/api';

interface ExchangePartner {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  exchangeRate: number;
  minAmount: number;
  maxAmount: number;
  rewardType: string;
  isActive: boolean;
}

export function ExchangePartnerCatalog() {
  const [partners, setPartners] = useState<ExchangePartner[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnersRes, walletRes] = await Promise.all([
          fetch('/api/playcoin/exchange', { credentials: 'include' }),
          getWallet(),
        ]);

        if (partnersRes.ok) {
          const data = await partnersRes.json();
          setPartners(data.partners || []);
        }

        setBalance(walletRes.data.balance);
      } catch (error) {
        console.error('Failed to fetch exchange partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExchange = async (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const amount = prompt(`Enter amount to exchange (${partner.minAmount} - ${partner.maxAmount} coins):`);
    if (!amount) return;

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < partner.minAmount || amountNum > partner.maxAmount) {
      alert(`Please enter a valid amount between ${partner.minAmount} and ${partner.maxAmount}`);
      return;
    }

    try {
      const res = await fetch('/api/playcoin/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ partnerId, amount: amountNum }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Exchange failed');
      }

      const data = await res.json();
      alert(`Exchange successful! Your code: ${data.result.code}`);
      setBalance(prev => prev - amountNum);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Exchange failed');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-56 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="card text-center py-12 animate-bounce-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
          <span className="text-2xl">🤝</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">No Partners Available</h3>
        <p className="text-gray-500">Exchange partners will appear here soon</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {partners.map((partner, index) => (
        <div key={partner.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
          <ExchangePartnerCard
            partner={partner}
            userBalance={balance}
            onExchange={handleExchange}
          />
        </div>
      ))}
    </div>
  );
}
