'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { VenueDetail, BookingForm, BookingConfirmation, type BookingFormData } from '@/components/paradise';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DateVenue } from '@/lib/services/venue';
import type { BookingWithVenue } from '@/lib/services/booking';

interface Match {
  id: string;
  partner_name: string;
}

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [venue, setVenue] = useState<DateVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showMatchSelect, setShowMatchSelect] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingWithVenue | null>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await fetch(`/api/dates/venues/${id}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 404) {
            router.push('/dates');
            return;
          }
          throw new Error('Failed to fetch venue');
        }

        const data = await res.json();
        setVenue(data.venue);
      } catch (error) {
        console.error('Error fetching venue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id, router]);

  const handleBookClick = async () => {
    try {
      const res = await fetch('/api/matches', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch matches');

      const data = await res.json();
      setMatches(data.matches.map((m: { id: string; partner: { display_name: string } }) => ({
        id: m.id,
        partner_name: m.partner.display_name,
      })));

      if (data.matches.length === 0) {
        alert('You need a match to book a venue');
        return;
      }

      if (data.matches.length === 1) {
        setSelectedMatchId(data.matches[0].id);
        setShowBookingDialog(true);
      } else {
        setShowMatchSelect(true);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    setShowMatchSelect(false);
    setShowBookingDialog(true);
  };

  const handleBookingSubmit = async (data: BookingFormData) => {
    try {
      const res = await fetch('/api/dates/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const result = await res.json();
      setShowBookingDialog(false);
      setConfirmedBooking({
        ...result.booking,
        venue_name: venue?.name || '',
        venue_type: venue?.venue_type || '',
        venue_address: venue?.address || null,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 max-w-3xl">
        <div className="card text-center py-16 animate-bounce-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center animate-float">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return null;
  }

  if (confirmedBooking) {
    return (
      <div className="container mx-auto py-6">
        <BookingConfirmation booking={confirmedBooking} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <button onClick={() => router.back()} className="btn-secondary mb-4 animate-slide-up">
        ← Back
      </button>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <VenueDetail venue={venue} onBook={handleBookClick} />
      </div>

      <Dialog open={showMatchSelect} onOpenChange={setShowMatchSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="gradient-text">Select a Match</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-500">
              Who do you want to book this venue with?
            </p>
            <Select onValueChange={handleMatchSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select your date" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((match) => (
                  <SelectItem key={match.id} value={match.id}>
                    {match.partner_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <BookingForm
            matchId={selectedMatchId}
            venueId={venue.id}
            venueName={venue.name}
            onSubmit={handleBookingSubmit}
            onCancel={() => setShowBookingDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
