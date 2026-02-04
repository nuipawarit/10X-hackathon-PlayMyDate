'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      <div className="space-y-6">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-5 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="card text-center py-16 animate-bounce-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center animate-float">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Venue not found</h3>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold gradient-text">{venue.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${venue.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {venue.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{venue.venue_type}</span>
            {venue.cuisine_type && <span className="text-xs bg-secondary-50 text-secondary-600 px-2.5 py-1 rounded-full">{venue.cuisine_type}</span>}
            {venue.price_range && (
              <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">{'฿'.repeat(venue.price_range)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/b2b/venues/${id}/edit`}>
            <button className="btn-secondary">Edit</button>
          </Link>
          <button className="btn-secondary" onClick={handleToggleActive}>
            {venue.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button className="btn-secondary" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
          <div className="space-y-4">
            {venue.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-800">{venue.description}</p>
              </div>
            )}
            {venue.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-800">📍 {venue.address}</p>
              </div>
            )}
            {venue.rating && (
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-amber-600 font-medium">⭐ {venue.rating}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Booking</p>
              <p className="text-gray-800">{venue.booking_enabled ? '✅ Enabled' : '❌ Disabled'}</p>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
          <div className="space-y-4">
            {venue.ambiance_tags && venue.ambiance_tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Ambiance Tags</p>
                <div className="flex flex-wrap gap-1">
                  {venue.ambiance_tags.map((tag) => (
                    <span key={tag} className="text-xs bg-accent-50 text-accent-600 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {venue.opening_hours && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Opening Hours</p>
                <div className="text-sm space-y-1">
                  {Object.entries(venue.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-gray-700">
                      <span className="capitalize">{day}</span>
                      <span>{hours.open} - {hours.close}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm text-gray-700">{new Date(venue.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
