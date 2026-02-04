'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MerchantProfile {
  id: string;
  name: string;
  business_type: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  status: string;
  tier: string;
  api_key: string | null;
}

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });

  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch('/api/b2b/merchant', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMerchant(data.merchant);
          setFormData({
            name: data.merchant.name || '',
            description: data.merchant.description || '',
            contactEmail: data.merchant.contact_email || '',
            contactPhone: data.merchant.contact_phone || '',
            address: data.merchant.address || '',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMerchant();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/b2b/merchant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setMerchant(data.merchant);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-5 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="space-y-6">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-extrabold gradient-text">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your merchant profile and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Profile</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Business Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="text-gray-700">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-gray-700">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-800 capitalize">{merchant?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tier</span>
                <span className="font-medium text-gray-800 capitalize">{merchant?.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Business Type</span>
                <span className="font-medium text-gray-800 capitalize">{merchant?.business_type}</span>
              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">API Access</h2>
            <div className="space-y-3">
              <Label className="text-gray-700">API Key</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={merchant?.api_key || 'Not generated'}
                  readOnly
                  className="font-mono"
                />
                <button className="btn-secondary">Regenerate</button>
              </div>
              <p className="text-xs text-gray-500">
                Use this API key to integrate with our platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
