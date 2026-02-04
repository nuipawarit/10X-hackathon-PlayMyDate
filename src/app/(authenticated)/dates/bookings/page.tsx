'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    switch (status) {
      case 'confirmed':
        return <Badge>Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">
            Manage your date reservations
          </p>
        </div>
        <Link href="/dates">
          <Button>Browse Venues</Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No upcoming bookings
                </p>
                <Link href="/dates">
                  <Button>Browse Venues</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  getStatusBadge={getStatusBadge}
                  onCancel={handleCancel}
                  showCancelButton
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
          ) : pastBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No past bookings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  getStatusBadge={getStatusBadge}
                  onCancel={handleCancel}
                />
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{booking.venue_name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {booking.venue_type}
          </p>
        </div>
        {getStatusBadge(booking.status)}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-medium">
              {new Date(booking.booking_date).toLocaleDateString('th-TH', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Time:</span>
            <p className="font-medium">{booking.booking_time}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Party Size:</span>
            <p className="font-medium">{booking.party_size} people</p>
          </div>
          <div>
            <span className="text-muted-foreground">Confirmation:</span>
            <p className="font-mono font-medium">{booking.confirmation_code}</p>
          </div>
        </div>

        {booking.venue_address && (
          <p className="text-sm text-muted-foreground">
            📍 {booking.venue_address}
          </p>
        )}

        {showCancelButton && booking.status !== 'cancelled' && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onCancel(booking.id)}
          >
            Cancel Booking
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
