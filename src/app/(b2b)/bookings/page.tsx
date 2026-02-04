'use client';

import { useState, useEffect } from 'react';
import { B2BBookingList } from '@/components/b2b/BookingList';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Venue {
  id: string;
  name: string;
}

export default function BookingsPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');

  useEffect(() => {
    async function fetchVenues() {
      try {
        const res = await fetch('/api/b2b/venues', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setVenues(data.venues || []);
        }
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      }
    }
    fetchVenues();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">
            Manage and track all your venue bookings
          </p>
        </div>

        {venues.length > 1 && (
          <Select value={selectedVenue} onValueChange={setSelectedVenue}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <B2BBookingList venueId={selectedVenue === 'all' ? undefined : selectedVenue} />
    </div>
  );
}
