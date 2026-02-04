import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { createBooking, getUserBookings } from '@/lib/services/booking';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const result = await getUserBookings(userId, status);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ bookings: result.data });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const body = await request.json();

    if (!body.matchId || !body.venueId || !body.bookingDate || !body.bookingTime) {
      return NextResponse.json(
        { error: 'matchId, venueId, bookingDate, and bookingTime are required' },
        { status: 400 }
      );
    }

    const result = await createBooking(userId, {
      matchId: body.matchId,
      venueId: body.venueId,
      bookingDate: body.bookingDate,
      bookingTime: body.bookingTime,
      partySize: body.partySize,
      specialRequests: body.specialRequests,
      splitBillPreference: body.splitBillPreference,
    });

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ booking: result.data }, { status: 201 });
  });
}
