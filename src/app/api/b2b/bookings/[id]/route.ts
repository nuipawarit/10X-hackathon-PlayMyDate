import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id: bookingId } = await params;

    try {
      const result = await sql`
        SELECT
          b.*,
          v.name as venue_name,
          v.venue_type,
          v.address as venue_address
        FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        WHERE b.id = ${bookingId}
          AND v.merchant_id = ${merchantId}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json({ booking: result.rows[0] });
    } catch (error) {
      console.error('GET booking error:', error);
      return NextResponse.json({ error: 'Failed to get booking' }, { status: 500 });
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id: bookingId } = await params;
    const body = await request.json();

    try {
      const checkResult = await sql`
        SELECT b.id FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        WHERE b.id = ${bookingId}
          AND v.merchant_id = ${merchantId}
      `;

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
      if (body.status && !validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const result = await sql`
        UPDATE date_bookings
        SET
          status = COALESCE(${body.status ?? null}, status),
          special_requests = COALESCE(${body.specialRequests ?? null}, special_requests),
          updated_at = NOW()
        WHERE id = ${bookingId}
        RETURNING *
      `;

      return NextResponse.json({ booking: result.rows[0] });
    } catch (error) {
      console.error('PUT booking error:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
  });
}
