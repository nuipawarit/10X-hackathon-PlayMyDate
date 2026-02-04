'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface B2BBooking {
  id: string;
  venue_id: string;
  venue_name: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  special_requests: string | null;
  confirmation_code: string;
  status: string;
  created_at: string;
}

interface BookingCardProps {
  booking: B2BBooking;
  onStatusChange?: (id: string, status: string) => void;
}

export function B2BBookingCard({ booking, onStatusChange }: BookingCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline">No Show</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const isPast = new Date(booking.booking_date) < new Date();
  const canConfirm = booking.status === 'pending';
  const canComplete = booking.status === 'confirmed' && isPast;
  const canCancel = ['pending', 'confirmed'].includes(booking.status) && !isPast;
  const canMarkNoShow = booking.status === 'confirmed' && isPast;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{booking.venue_name}</p>
              {getStatusBadge(booking.status)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Date: </span>
                {new Date(booking.booking_date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-muted-foreground">Time: </span>
                {booking.booking_time}
              </div>
              <div>
                <span className="text-muted-foreground">Party: </span>
                {booking.party_size} guests
              </div>
              <div>
                <span className="text-muted-foreground">Code: </span>
                <code className="text-xs">{booking.confirmation_code}</code>
              </div>
            </div>
            {booking.special_requests && (
              <p className="text-sm text-muted-foreground">
                Note: {booking.special_requests}
              </p>
            )}
          </div>

          {onStatusChange && (
            <div className="flex flex-wrap gap-1">
              {canConfirm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(booking.id, 'confirmed')}
                >
                  Confirm
                </Button>
              )}
              {canComplete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600"
                  onClick={() => onStatusChange(booking.id, 'completed')}
                >
                  Complete
                </Button>
              )}
              {canMarkNoShow && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(booking.id, 'no_show')}
                >
                  No Show
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => onStatusChange(booking.id, 'cancelled')}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
