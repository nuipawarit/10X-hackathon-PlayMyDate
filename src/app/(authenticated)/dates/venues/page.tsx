'use client';

import { useState, useEffect, useCallback } from 'react';
import { VenueSearch, VenueCard, type VenueSearchFilters } from '@/components/paradise';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { DateVenue } from '@/lib/services/venue';

export default function BrowseVenuesPage() {
  const [venues, setVenues] = useState<DateVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;

  const fetchVenues = useCallback(async (filters: VenueSearchFilters = {}, pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.venueType) params.set('venueType', filters.venueType);
      if (filters.priceRange) params.set('priceRange', filters.priceRange.toString());
      if (filters.cuisineType) params.set('cuisineType', filters.cuisineType);
      if (filters.ambianceTag) params.set('ambianceTag', filters.ambianceTag);
      params.set('limit', limit.toString());
      params.set('offset', ((pageNum - 1) * limit).toString());

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
    fetchVenues({}, page);
  }, [fetchVenues, page]);

  const handleSearch = (filters: VenueSearchFilters) => {
    setPage(1);
    fetchVenues(filters, 1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Venues</h1>
          <p className="text-muted-foreground">
            Find the perfect spot for your date
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dates/bookings">
            <Button variant="outline">My Bookings</Button>
          </Link>
          <Link href="/dates">
            <Button variant="outline">Back to Paradise</Button>
          </Link>
        </div>
      </div>

      <VenueSearch onSearch={handleSearch} />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading venues...</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No venues found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} venues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
