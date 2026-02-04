'use client';

import { useState, useEffect, useCallback } from 'react';
import { VenueSearch, VenueCard, QRScanner, type VenueSearchFilters } from '@/components/paradise';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { DateVenue } from '@/lib/services/venue';

export default function DatesPage() {
  const [venues, setVenues] = useState<DateVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchVenues = useCallback(async (filters: VenueSearchFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.venueType) params.set('venueType', filters.venueType);
      if (filters.priceRange) params.set('priceRange', filters.priceRange.toString());
      if (filters.cuisineType) params.set('cuisineType', filters.cuisineType);
      if (filters.ambianceTag) params.set('ambianceTag', filters.ambianceTag);

      const res = await fetch(`/api/dates/venues?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch venues');

      const data = await res.json();
      setVenues(data.venues);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleQRScan = async (qrCode: string) => {
    const res = await fetch('/api/dates/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ qrCode }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Check-in failed');
    }

    const data = await res.json();
    alert(`Check-in successful! You earned ${data.coinsEarned} PlayCoins! 🪙`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paradise Mode</h1>
          <p className="text-muted-foreground">
            Discover perfect date spots and earn PlayCoins
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dates/venues">
            <Button variant="outline">Browse All Venues</Button>
          </Link>
          <Link href="/dates/bookings">
            <Button variant="outline">My Bookings</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="venues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="venues">Browse Venues</TabsTrigger>
          <TabsTrigger value="checkin">QR Check-in</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-6">
          <VenueSearch onSearch={fetchVenues} />

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading venues...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No venues found</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {venues.length} of {total} venues
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="checkin">
          <div className="max-w-md mx-auto">
            <QRScanner onScan={handleQRScan} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
