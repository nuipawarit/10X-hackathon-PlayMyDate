'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DateVenue } from '@/lib/services/venue';

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [venue, setVenue] = useState<DateVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchVenue() {
      try {
        const res = await fetch(`/api/b2b/venues/${id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setVenue(data.venue);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVenue();
  }, [id]);

  const handleToggleActive = async () => {
    if (!venue) return;

    const res = await fetch(`/api/b2b/venues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !venue.is_active }),
    });

    if (res.ok) {
      const data = await res.json();
      setVenue(data.venue);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    setDeleting(true);
    const res = await fetch(`/api/b2b/venues/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      router.push('/b2b/venues');
    } else {
      setDeleting(false);
      alert('Failed to delete venue');
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
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{venue.name}</h1>
            <Badge variant={venue.is_active ? 'default' : 'secondary'}>
              {venue.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{venue.venue_type}</Badge>
            {venue.cuisine_type && <Badge variant="outline">{venue.cuisine_type}</Badge>}
            {venue.price_range && (
              <Badge variant="outline">{'฿'.repeat(venue.price_range)}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/b2b/venues/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="outline" onClick={handleToggleActive}>
            {venue.is_active ? 'Deactivate' : 'Activate'}
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
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {venue.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{venue.description}</p>
              </div>
            )}
            {venue.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p>📍 {venue.address}</p>
              </div>
            )}
            {venue.rating && (
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p>⭐ {venue.rating}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Booking</p>
              <p>{venue.booking_enabled ? '✅ Enabled' : '❌ Disabled'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {venue.ambiance_tags && venue.ambiance_tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ambiance Tags</p>
                <div className="flex flex-wrap gap-1">
                  {venue.ambiance_tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {venue.opening_hours && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Opening Hours</p>
                <div className="text-sm space-y-1">
                  {Object.entries(venue.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize">{day}</span>
                      <span>{hours.open} - {hours.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(venue.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
