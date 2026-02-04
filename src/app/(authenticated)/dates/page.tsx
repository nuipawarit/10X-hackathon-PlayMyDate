'use client';

import { useState, useEffect, useCallback } from 'react';
import { VenueSearch, VenueCard, QRScanner, type VenueSearchFilters } from '@/components/paradise';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Paradise Mode</h1>
          <p className="text-gray-500 mt-1">
            Discover perfect date spots and earn PlayCoins
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dates/venues">
            <button className="btn-secondary">Browse All Venues</button>
          </Link>
          <Link href="/dates/bookings">
            <button className="btn-accent">My Bookings</button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="venues" className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabsList>
          <TabsTrigger value="venues">Browse Venues</TabsTrigger>
          <TabsTrigger value="checkin">QR Check-in</TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-6">
          <VenueSearch onSearch={fetchVenues} />

          {loading ? (
            <div className="card text-center py-16 animate-bounce-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center animate-float">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500">Loading venues...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="card text-center py-16 animate-bounce-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No venues found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Showing {venues.length} of {total} venues
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue, index) => (
                  <div key={venue.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <VenueCard venue={venue} />
                  </div>
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
