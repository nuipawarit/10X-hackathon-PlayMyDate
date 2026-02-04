'use client';

import { CampaignEditor } from '@/components/b2b';

export default function NewCampaignPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Create New Campaign</h1>
        <p className="text-gray-500 mt-1">
          Set up a new marketing campaign
        </p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CampaignEditor />
      </div>
    </div>
  );
}
