'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="space-y-6">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-5 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="card text-center py-16 animate-bounce-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Quest not found</h3>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold gradient-text">{quest.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${quest.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {quest.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {quest.campaign_name && (
            <p className="text-gray-500 mt-1">
              Campaign: {quest.campaign_name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <button className="btn-secondary">Edit</button>
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
                  <button type="submit" disabled={saving || !editData.name} className="btn-primary disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <button className="btn-secondary" onClick={handleToggleActive}>
            {quest.is_active ? 'Pause' : 'Activate'}
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button className="btn-secondary" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quest Details</h2>
          <div className="space-y-4">
            {quest.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-800">{quest.description}</p>
              </div>
            )}
            {quest.instructions && (
              <div>
                <p className="text-sm text-gray-500">Instructions</p>
                <p className="whitespace-pre-wrap text-gray-800">{quest.instructions}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Coin Reward</p>
                <p className="text-2xl font-bold text-amber-600">{quest.coin_reward}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {quest.completion_count}
                  {quest.max_completions && (
                    <span className="text-base font-normal text-gray-500">
                      {' / '}{quest.max_completions}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-800">{new Date(quest.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
