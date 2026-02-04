'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { B2BBookingCard, type B2BBooking } from './BookingCard';
import { MetricCard } from './MetricCard';

interface BookingStats {
  confirmed: number;
  completed: number;
  cancelled: number;
  pending: number;
}

interface BookingListProps {
  venueId?: string;
}

export function B2BBookingList({ venueId }: BookingListProps) {
  const [bookings, setBookings] = useState<B2BBooking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ confirmed: 0, completed: 0, cancelled: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchBookings = async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      if (venueId) params.set('venueId', venueId);

      const res = await fetch(`/api/b2b/bookings?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(filter);
  }, [filter, venueId]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/b2b/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchBookings(filter);
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const totalBookings = stats.confirmed + stats.completed + stats.cancelled + stats.pending;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Pending"
          value={stats.pending.toString()}
          description="Awaiting confirmation"
        />
        <MetricCard
          title="Confirmed"
          value={stats.confirmed.toString()}
          description="Upcoming bookings"
        />
        <MetricCard
          title="Completed"
          value={stats.completed.toString()}
          description="Successfully served"
        />
        <MetricCard
          title="Cancelled"
          value={stats.cancelled.toString()}
          description="Cancelled bookings"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings ({totalBookings})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({stats.cancelled})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter}>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bookings found
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <B2BBookingCard
                      key={booking.id}
                      booking={booking}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
