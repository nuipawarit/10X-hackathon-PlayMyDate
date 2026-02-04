import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const venueId = searchParams.get('venueId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
      let whereConditions = [`v.merchant_id = '${merchantId}'`];

      if (status) {
        whereConditions.push(`b.status = '${status}'`);
      }
      if (venueId) {
        whereConditions.push(`b.venue_id = '${venueId}'`);
      }

      const whereClause = whereConditions.join(' AND ');

      const bookingsResult = await sql.query(`
        SELECT
          b.id,
          b.venue_id,
          v.name as venue_name,
          b.booking_date,
          b.booking_time,
          b.party_size,
          b.special_requests,
          b.confirmation_code,
          b.status,
          b.created_at
        FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        WHERE ${whereClause}
        ORDER BY b.booking_date DESC, b.booking_time DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const countResult = await sql.query(`
        SELECT COUNT(*) as total
        FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        WHERE ${whereClause}
      `);

      const statsResult = await sql`
        SELECT
          COUNT(*) FILTER (WHERE b.status = 'confirmed') as confirmed,
          COUNT(*) FILTER (WHERE b.status = 'completed') as completed,
          COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE b.status = 'pending') as pending
        FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        WHERE v.merchant_id = ${merchantId}
      `;

      return NextResponse.json({
        bookings: bookingsResult.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        stats: {
          confirmed: parseInt(statsResult.rows[0]?.confirmed || '0'),
          completed: parseInt(statsResult.rows[0]?.completed || '0'),
          cancelled: parseInt(statsResult.rows[0]?.cancelled || '0'),
          pending: parseInt(statsResult.rows[0]?.pending || '0'),
        },
      });
    } catch (error) {
      console.error('GET bookings error:', error);
      return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 });
    }
  });
}
