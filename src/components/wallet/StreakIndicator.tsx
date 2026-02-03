'use client';

import { useEffect, useState } from 'react';
import { getCheckinStatus } from '@/lib/api';

interface StreakIndicatorProps {
  compact?: boolean;
}

export default function StreakIndicator({ compact = false }: StreakIndicatorProps) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const { data } = await getCheckinStatus();
        setStreak(data.currentStreak);
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  if (loading) {
    return <span className="text-sm text-muted-foreground">...</span>;
  }

  if (compact) {
    return (
      <span className="text-sm font-medium flex items-center gap-1">
        <span>🔥</span>
        <span>{streak}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-sm font-medium">{streak} day streak</p>
        <p className="text-xs text-muted-foreground">Keep it going!</p>
      </div>
    </div>
  );
}
