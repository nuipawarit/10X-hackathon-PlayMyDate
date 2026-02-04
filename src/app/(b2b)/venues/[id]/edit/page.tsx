'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DateVenue } from '@/lib/services/venue';

export default function VenueEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [venue, setVenue] = useState<DateVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    venueType: '',
    description: '',
    address: '',
    priceRange: '',
    cuisineType: '',
    bookingEnabled: true,
  });

  useEffect(() => {
    async function fetchVenue() {
      try {
        const res = await fetch(`/api/b2b/venues/${id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setVenue(data.venue);
          setFormData({
            name: data.venue.name || '',
            venueType: data.venue.venue_type || '',
            description: data.venue.description || '',
            address: data.venue.address || '',
            priceRange: data.venue.price_range?.toString() || '',
            cuisineType: data.venue.cuisine_type || '',
            bookingEnabled: data.venue.booking_enabled ?? true,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVenue();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/b2b/venues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          venueType: formData.venueType,
          description: formData.description || undefined,
          address: formData.address || undefined,
          priceRange: formData.priceRange ? parseInt(formData.priceRange) : undefined,
          cuisineType: formData.cuisineType || undefined,
          bookingEnabled: formData.bookingEnabled,
        }),
      });

      if (res.ok) {
        router.push(`/b2b/venues/${id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update venue');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-96 bg-muted rounded" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venue not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Venue</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueType">Venue Type *</Label>
              <Select
                value={formData.venueType}
                onValueChange={(value) => setFormData({ ...formData, venueType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceRange">Price Range</Label>
                <Select
                  value={formData.priceRange}
                  onValueChange={(value) => setFormData({ ...formData, priceRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">฿</SelectItem>
                    <SelectItem value="2">฿฿</SelectItem>
                    <SelectItem value="3">฿฿฿</SelectItem>
                    <SelectItem value="4">฿฿฿฿</SelectItem>
                    <SelectItem value="5">฿฿฿฿฿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Cuisine Type</Label>
                <Select
                  value={formData.cuisineType}
                  onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="thai">Thai</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="korean">Korean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="bookingEnabled"
                checked={formData.bookingEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, bookingEnabled: checked })}
              />
              <Label htmlFor="bookingEnabled">Booking Enabled</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving || !formData.name || !formData.venueType}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
