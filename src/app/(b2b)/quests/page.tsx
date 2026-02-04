'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Quest {
  id: string;
  name: string;
  description: string | null;
  coin_reward: number;
  max_completions: number | null;
  completion_count: number;
  is_active: boolean;
  campaign_id: string;
  created_at: string;
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuests() {
      try {
        const res = await fetch('/api/b2b/quests', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setQuests(data.quests || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branded Quests</h1>
          <p className="text-muted-foreground">
            Manage your branded quests and activities
          </p>
        </div>
        <Link href="/quests/new">
          <Button>Create Quest</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No quests created yet</p>
            <Link href="/quests/new">
              <Button>Create Your First Quest</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((quest) => (
            <Card key={quest.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-lg">{quest.name}</CardTitle>
                <Badge variant={quest.is_active ? 'default' : 'secondary'}>
                  {quest.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {quest.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quest.description}
                  </p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reward</span>
                  <span className="font-medium">{quest.coin_reward} coins</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completions</span>
                  <span className="font-medium">
                    {quest.completion_count}
                    {quest.max_completions && ` / ${quest.max_completions}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
