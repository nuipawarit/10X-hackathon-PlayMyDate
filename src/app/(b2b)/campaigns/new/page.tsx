'use client';

import { CampaignEditor } from '@/components/b2b';

export default function NewCampaignPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground">
          Set up a new marketing campaign
        </p>
      </div>

      <CampaignEditor />
    </div>
  );
}
