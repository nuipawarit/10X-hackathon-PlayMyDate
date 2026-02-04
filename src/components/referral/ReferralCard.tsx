'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalEarned: number;
}

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const res = await fetch('/api/referral', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const copyLink = async () => {
    if (!stats) return;
    try {
      const link = `${window.location.origin}/register?ref=${stats.referralCode}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Invite Friends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral code and earn 100 PlayCoins for each friend who joins!
        </p>

        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted px-4 py-2 rounded-lg text-center font-mono text-lg">
            {stats.referralCode}
          </code>
          <Button variant="outline" size="sm" onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <Button variant="secondary" className="w-full" onClick={copyLink}>
          Copy Invite Link
        </Button>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.referralCount}</p>
            <p className="text-xs text-muted-foreground">Friends Invited</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalEarned}</p>
            <p className="text-xs text-muted-foreground">Coins Earned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
