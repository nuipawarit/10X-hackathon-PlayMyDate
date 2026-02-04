'use client';

import { useState, useEffect, useCallback } from 'react';
import { VenueSearch, VenueCard, type VenueSearchFilters } from '@/components/paradise';
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
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Browse Venues</h1>
          <p className="text-gray-500 mt-1">
            Find the perfect spot for your date
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dates/bookings">
            <button className="btn-accent">My Bookings</button>
          </Link>
          <Link href="/dates">
            <button className="btn-secondary">Back to Paradise</button>
          </Link>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <VenueSearch onSearch={handleSearch} />
      </div>

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
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} venues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venues.map((venue, index) => (
              <div key={venue.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <VenueCard venue={venue} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                className="btn-secondary disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 px-4">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-primary disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
