'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCheckinStatus, performCheckin, type CheckinStatus } from '@/lib/api';

export default function DailyCheckin() {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await getCheckinStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch check-in status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleCheckin = async () => {
    if (!status || status.checkedInToday) return;

    setChecking(true);
    try {
      const { data } = await performCheckin();
      setEarnedCoins(data.coinsEarned);
      setShowSuccess(true);
      setStatus({
        checkedInToday: true,
        currentStreak: data.newStreak,
        lastCheckin: data.checkin,
      });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={showSuccess ? 'ring-2 ring-green-500 bg-green-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📅</span>
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSuccess ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-bold text-green-600">+{earnedCoins} PlayCoins!</p>
            <p className="text-sm text-muted-foreground">
              Day {status?.currentStreak} streak bonus applied
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">🔥 {status?.currentStreak || 0} days</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Next Reward</p>
                <p className="font-medium">
                  +{10 + Math.min((status?.currentStreak || 0) * 5, 40)} coins
                </p>
              </div>
            </div>

            <Button
              onClick={handleCheckin}
              disabled={status?.checkedInToday || checking}
              className="w-full"
              size="lg"
            >
              {checking
                ? 'Checking in...'
                : status?.checkedInToday
                  ? '✓ Checked in today'
                  : 'Check in now'}
            </Button>

            {status?.checkedInToday && (
              <p className="text-center text-sm text-muted-foreground">
                Come back tomorrow to continue your streak!
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
