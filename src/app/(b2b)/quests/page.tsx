'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Branded Quests</h1>
          <p className="text-gray-500 mt-1">
            Manage your branded quests and activities
          </p>
        </div>
        <Link href="/b2b/quests/new">
          <button className="btn-primary">Create Quest</button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="card text-center py-16 animate-bounce-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No quests created yet</h3>
          <p className="text-gray-500 mb-6">Create your first quest to engage users</p>
          <Link href="/b2b/quests/new">
            <button className="btn-primary">Create Your First Quest</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((quest, index) => (
            <Link key={quest.id} href={`/b2b/quests/${quest.id}`}>
              <div className="card-hover animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-800">{quest.name}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${quest.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {quest.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {quest.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {quest.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Reward</span>
                    <span className="font-medium text-amber-600">{quest.coin_reward} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Completions</span>
                    <span className="font-medium text-gray-700">
                      {quest.completion_count}
                      {quest.max_completions && ` / ${quest.max_completions}`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
