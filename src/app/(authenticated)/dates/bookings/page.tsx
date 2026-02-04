'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SplitBillBadge } from '@/components/paradise';
import type { BookingWithVenue } from '@/lib/services/booking';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithVenue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async (status?: string) => {
    setLoading(true);
    try {
      const url = status ? `/api/dates/bookings?status=${status}` : '/api/dates/bookings';
      const res = await fetch(url, { credentials: 'include' });

      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data = await res.json();
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await fetch(`/api/dates/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to cancel booking');

      fetchBookings();
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">My Bookings</h1>
          <p className="text-gray-500 mt-1">
            Manage your date reservations
          </p>
        </div>
        <Link href="/dates">
          <button className="btn-accent">Browse Venues</button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="card text-center py-16 animate-bounce-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-rose-100 flex items-center justify-center animate-float">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No upcoming bookings</h3>
              <p className="text-gray-500 mb-6">Find your next perfect date spot</p>
              <Link href="/dates">
                <button className="btn-primary">Browse Venues</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking, index) => (
                <div key={booking.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <BookingCard
                    booking={booking}
                    getStatusBadge={getStatusBadge}
                    onCancel={handleCancel}
                    showCancelButton
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-40 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
          ) : pastBookings.length === 0 ? (
            <div className="card text-center py-16 animate-bounce-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No past bookings</h3>
              <p className="text-gray-500">Your completed dates will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking, index) => (
                <div key={booking.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <BookingCard
                    booking={booking}
                    getStatusBadge={getStatusBadge}
                    onCancel={handleCancel}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({
  booking,
  getStatusBadge,
  onCancel,
  showCancelButton,
}: {
  booking: BookingWithVenue;
  getStatusBadge: (status: string) => React.ReactNode;
  onCancel: (id: string) => void;
  showCancelButton?: boolean;
}) {
  return (
    <div className="card-hover">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{booking.venue_name}</h3>
          <p className="text-sm text-gray-500">
            {booking.venue_type}
          </p>
        </div>
        {getStatusBadge(booking.status)}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Date:</span>
            <p className="font-medium text-gray-800">
              {new Date(booking.booking_date).toLocaleDateString('th-TH', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Time:</span>
            <p className="font-medium text-gray-800">{booking.booking_time}</p>
          </div>
          <div>
            <span className="text-gray-400">Party Size:</span>
            <p className="font-medium text-gray-800">{booking.party_size} people</p>
          </div>
          <div>
            <span className="text-gray-400">Confirmation:</span>
            <p className="font-mono font-medium text-primary-600">{booking.confirmation_code}</p>
          </div>
          {booking.split_bill_preference && (
            <div>
              <span className="text-gray-400">Split Bill:</span>
              <div className="mt-1">
                <SplitBillBadge preference={booking.split_bill_preference} />
              </div>
            </div>
          )}
        </div>

        {booking.venue_address && (
          <p className="text-sm text-gray-500">
            📍 {booking.venue_address}
          </p>
        )}

        {showCancelButton && booking.status !== 'cancelled' && (
          <button
            className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => onCancel(booking.id)}
          >
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
}
