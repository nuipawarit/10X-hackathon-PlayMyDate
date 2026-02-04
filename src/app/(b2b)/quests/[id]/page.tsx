'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { QuestWithCampaign } from '@/lib/services/quest';

export default function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quest, setQuest] = useState<QuestWithCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    instructions: '',
    coinReward: 0,
    maxCompletions: '',
  });

  useEffect(() => {
    async function fetchQuest() {
      try {
        const res = await fetch(`/api/b2b/quests/${id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setQuest(data.quest);
          setEditData({
            name: data.quest.name || '',
            description: data.quest.description || '',
            instructions: data.quest.instructions || '',
            coinReward: data.quest.coin_reward || 0,
            maxCompletions: data.quest.max_completions?.toString() || '',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchQuest();
  }, [id]);

  const handleToggleActive = async () => {
    if (!quest) return;

    const res = await fetch(`/api/b2b/quests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !quest.is_active }),
    });

    if (res.ok) {
      const data = await res.json();
      setQuest({ ...data.quest, campaign_name: quest.campaign_name });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quest?')) return;

    setDeleting(true);
    const res = await fetch(`/api/b2b/quests/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      router.push('/b2b/quests');
    } else {
      setDeleting(false);
      alert('Failed to delete quest');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/b2b/quests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editData.name,
          description: editData.description || undefined,
          instructions: editData.instructions || undefined,
          coinReward: editData.coinReward,
          maxCompletions: editData.maxCompletions ? parseInt(editData.maxCompletions) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuest({ ...data.quest, campaign_name: quest?.campaign_name });
        setIsEditOpen(false);
      } else {
        alert('Failed to update quest');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quest not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quest.name}</h1>
            <Badge variant={quest.is_active ? 'default' : 'secondary'}>
              {quest.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {quest.campaign_name && (
            <p className="text-muted-foreground mt-1">
              Campaign: {quest.campaign_name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Quest</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Quest Name</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={editData.instructions}
                    onChange={(e) => setEditData({ ...editData, instructions: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coinReward">Coin Reward</Label>
                    <Input
                      id="coinReward"
                      type="number"
                      min="0"
                      value={editData.coinReward}
                      onChange={(e) => setEditData({ ...editData, coinReward: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCompletions">Max Completions</Label>
                    <Input
                      id="maxCompletions"
                      type="number"
                      min="1"
                      value={editData.maxCompletions}
                      onChange={(e) => setEditData({ ...editData, maxCompletions: e.target.value })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving || !editData.name}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleToggleActive}>
            {quest.is_active ? 'Pause' : 'Activate'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quest.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{quest.description}</p>
              </div>
            )}
            {quest.instructions && (
              <div>
                <p className="text-sm text-muted-foreground">Instructions</p>
                <p className="whitespace-pre-wrap">{quest.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Coin Reward</p>
                <p className="text-2xl font-bold">{quest.coin_reward}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completions</p>
                <p className="text-2xl font-bold">
                  {quest.completion_count}
                  {quest.max_completions && (
                    <span className="text-base font-normal text-muted-foreground">
                      {' / '}{quest.max_completions}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{new Date(quest.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
