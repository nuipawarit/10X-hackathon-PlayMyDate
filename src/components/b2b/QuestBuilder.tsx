'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuestBuilderProps {
  campaignId: string;
  onSave?: () => void;
}

interface QuestFormData {
  name: string;
  description: string;
  instructions: string;
  activityId: string;
  coinReward: number;
  maxCompletions?: number;
}

export function QuestBuilder({ campaignId, onSave }: QuestBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<QuestFormData>({
    name: '',
    description: '',
    instructions: '',
    activityId: '',
    coinReward: 50,
    maxCompletions: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/b2b/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          campaignId,
        }),
      });

      if (res.ok) {
        onSave?.();
        router.push('/b2b/quests');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Branded Quest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Quest Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Visit Starbucks Together"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full min-h-[80px] px-3 py-2 border rounded-md"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what users will do..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <textarea
              id="instructions"
              className="w-full min-h-[80px] px-3 py-2 border rounded-md"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Step-by-step instructions for users..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coinReward">Coin Reward</Label>
              <Input
                id="coinReward"
                type="number"
                min="0"
                value={formData.coinReward}
                onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCompletions">Max Completions (Optional)</Label>
              <Input
                id="maxCompletions"
                type="number"
                min="1"
                value={formData.maxCompletions || ''}
                onChange={(e) => setFormData({ ...formData, maxCompletions: parseInt(e.target.value) || undefined })}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quest'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
