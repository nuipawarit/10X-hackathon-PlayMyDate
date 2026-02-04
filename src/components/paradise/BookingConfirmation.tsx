'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { BookingWithVenue } from '@/lib/services/booking';

interface BookingConfirmationProps {
  booking: BookingWithVenue;
}

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">🎉</div>
        <CardTitle>Booking Confirmed!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Confirmation Code</p>
          <p className="text-2xl font-mono font-bold">{booking.confirmation_code}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Venue</span>
            <span className="font-medium">{booking.venue_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">
              {new Date(booking.booking_date).toLocaleDateString('th-TH', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">{booking.booking_time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Party Size</span>
            <span className="font-medium">{booking.party_size} people</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
              {booking.status}
            </Badge>
          </div>
        </div>

        {booking.venue_address && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-1">📍 Address</p>
            <p className="text-sm">{booking.venue_address}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Link href="/dates/bookings" className="flex-1">
            <Button variant="outline" className="w-full">
              View All Bookings
            </Button>
          </Link>
          <Link href="/dates" className="flex-1">
            <Button className="w-full">Browse More Venues</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
