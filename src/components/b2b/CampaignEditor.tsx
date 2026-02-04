'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TargetAudienceSelector, type TargetAudience } from './TargetAudienceSelector';
import type { Campaign, CreateCampaignInput } from '@/lib/services/campaign';

interface CampaignEditorProps {
  campaign?: Campaign;
  onSave?: (data: CreateCampaignInput) => void;
}

export function CampaignEditor({ campaign, onSave }: CampaignEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: campaign?.name || '',
    type: campaign?.type || 'awareness',
    description: campaign?.description || '',
    budget: campaign?.budget ? parseFloat(campaign.budget) : undefined,
    cpaRate: campaign?.cpa_rate ? parseFloat(campaign.cpa_rate) : undefined,
    cpmiRate: campaign?.cpmi_rate ? parseFloat(campaign.cpmi_rate) : undefined,
    startDate: campaign?.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
    endDate: campaign?.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
    targetAudience: (campaign?.target_audience as Record<string, unknown>) || {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = campaign ? `/api/b2b/campaigns/${campaign.id}` : '/api/b2b/campaigns';
      const method = campaign ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave?.(formData);
        router.push('/campaigns');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Campaign Type</Label>
            <select
              id="type"
              className="w-full h-10 px-3 border rounded-md"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="awareness">Awareness</option>
              <option value="engagement">Engagement</option>
              <option value="conversion">Conversion</option>
              <option value="retention">Retention</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (฿)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpaRate">CPA Rate (฿)</Label>
              <Input
                id="cpaRate"
                type="number"
                value={formData.cpaRate || ''}
                onChange={(e) => setFormData({ ...formData, cpaRate: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <TargetAudienceSelector
            value={formData.targetAudience || {}}
            onChange={(audience) => setFormData({ ...formData, targetAudience: audience as Record<string, unknown> })}
          />

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
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
