import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';
import { earnCoins } from './playcoin';
import crypto from 'crypto';

export interface DateBooking {
  id: string;
  match_id: string;
  venue_id: string;
  initiated_by_user_id: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  special_requests: string | null;
  confirmation_code: string;
  status: string;
  voucher_applied_id: string | null;
  split_bill_preference: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BookingWithVenue extends DateBooking {
  venue_name: string;
  venue_type: string;
  venue_address: string | null;
}

export interface QRCheckin {
  id: string;
  user_id: string;
  venue_id: string;
  booking_id: string | null;
  qr_code: string;
  coins_earned: number;
  checked_in_at: Date;
}

export interface CreateBookingInput {
  matchId: string;
  venueId: string;
  bookingDate: string;
  bookingTime: string;
  partySize?: number;
  specialRequests?: string;
  splitBillPreference?: string;
}

function generateConfirmationCode(): string {
  return `PMD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createBooking(
  userId: string,
  data: CreateBookingInput
): Promise<ServiceResult<DateBooking>> {
  try {
    const matchResult = await sql`
      SELECT * FROM matches
      WHERE id = ${data.matchId}
      AND (user1_id = ${userId} OR user2_id = ${userId})
      AND status = 'matched'
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found or not authorized', 'NOT_FOUND');
    }

    const venueResult = await sql`
      SELECT * FROM date_venues WHERE id = ${data.venueId} AND is_active = true AND booking_enabled = true
    `;

    if (venueResult.rows.length === 0) {
      return failure('Venue not found or booking not available', 'NOT_FOUND');
    }

    const confirmationCode = generateConfirmationCode();

    const result = await sql`
      INSERT INTO date_bookings (
        match_id, venue_id, initiated_by_user_id, booking_date, booking_time,
        party_size, special_requests, confirmation_code, status, split_bill_preference
      )
      VALUES (
        ${data.matchId}, ${data.venueId}, ${userId}, ${data.bookingDate}, ${data.bookingTime},
        ${data.partySize ?? 2}, ${data.specialRequests ?? null}, ${confirmationCode},
        'confirmed', ${data.splitBillPreference ?? null}
      )
      RETURNING *
    `;

    return success(result.rows[0] as DateBooking);
  } catch (error) {
    console.error('createBooking error:', error);
    return failure('Failed to create booking', 'INTERNAL_ERROR');
  }
}

export async function getBookingById(
  bookingId: string,
  userId: string
): Promise<ServiceResult<BookingWithVenue>> {
  try {
    const result = await sql`
      SELECT b.*, v.name as venue_name, v.venue_type, v.address as venue_address
      FROM date_bookings b
      JOIN date_venues v ON b.venue_id = v.id
      JOIN matches m ON b.match_id = m.id
      WHERE b.id = ${bookingId}
      AND (m.user1_id = ${userId} OR m.user2_id = ${userId})
    `;

    if (result.rows.length === 0) {
      return failure('Booking not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as BookingWithVenue);
  } catch (error) {
    console.error('getBookingById error:', error);
    return failure('Failed to get booking', 'INTERNAL_ERROR');
  }
}

export async function getUserBookings(
  userId: string,
  status?: string
): Promise<ServiceResult<BookingWithVenue[]>> {
  try {
    let result;
    if (status) {
      result = await sql`
        SELECT b.*, v.name as venue_name, v.venue_type, v.address as venue_address
        FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        JOIN matches m ON b.match_id = m.id
        WHERE (m.user1_id = ${userId} OR m.user2_id = ${userId})
        AND b.status = ${status}
        ORDER BY b.booking_date DESC, b.booking_time DESC
      `;
    } else {
      result = await sql`
        SELECT b.*, v.name as venue_name, v.venue_type, v.address as venue_address
        FROM date_bookings b
        JOIN date_venues v ON b.venue_id = v.id
        JOIN matches m ON b.match_id = m.id
        WHERE (m.user1_id = ${userId} OR m.user2_id = ${userId})
        ORDER BY b.booking_date DESC, b.booking_time DESC
      `;
    }

    return success(result.rows as BookingWithVenue[]);
  } catch (error) {
    console.error('getUserBookings error:', error);
    return failure('Failed to get bookings', 'INTERNAL_ERROR');
  }
}

export async function updateBookingStatus(
  bookingId: string,
  userId: string,
  status: string
): Promise<ServiceResult<DateBooking>> {
  try {
    const checkResult = await sql`
      SELECT b.* FROM date_bookings b
      JOIN matches m ON b.match_id = m.id
      WHERE b.id = ${bookingId}
      AND (m.user1_id = ${userId} OR m.user2_id = ${userId})
    `;

    if (checkResult.rows.length === 0) {
      return failure('Booking not found or not authorized', 'NOT_FOUND');
    }

    const result = await sql`
      UPDATE date_bookings
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${bookingId}
      RETURNING *
    `;

    return success(result.rows[0] as DateBooking);
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    return failure('Failed to update booking status', 'INTERNAL_ERROR');
  }
}

export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<ServiceResult<DateBooking>> {
  try {
    const checkResult = await sql`
      SELECT b.* FROM date_bookings b
      JOIN matches m ON b.match_id = m.id
      WHERE b.id = ${bookingId}
      AND (m.user1_id = ${userId} OR m.user2_id = ${userId})
      AND b.status NOT IN ('cancelled', 'completed')
    `;

    if (checkResult.rows.length === 0) {
      return failure('Booking not found or cannot be cancelled', 'NOT_FOUND');
    }

    const result = await sql`
      UPDATE date_bookings
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${bookingId}
      RETURNING *
    `;

    return success(result.rows[0] as DateBooking);
  } catch (error) {
    console.error('cancelBooking error:', error);
    return failure('Failed to cancel booking', 'INTERNAL_ERROR');
  }
}

const QR_CHECKIN_COINS = 50;

export async function performQRCheckin(
  userId: string,
  qrCode: string
): Promise<ServiceResult<{ checkin: QRCheckin; coinsEarned: number }>> {
  try {
    const parts = qrCode.split('/');
    if (parts.length < 3 || !parts[2]) {
      return failure('Invalid QR code format', 'INVALID_QR_CODE');
    }

    const venueId = parts[2];

    const venueResult = await sql`
      SELECT * FROM date_venues WHERE id = ${venueId} AND is_active = true
    `;

    if (venueResult.rows.length === 0) {
      return failure('Venue not found', 'NOT_FOUND');
    }

    const existingCheckin = await sql`
      SELECT * FROM qr_checkins
      WHERE user_id = ${userId} AND venue_id = ${venueId}
      AND checked_in_at > NOW() - INTERVAL '24 hours'
    `;

    if (existingCheckin.rows.length > 0) {
      return failure('Already checked in at this venue today', 'ALREADY_CHECKED_IN');
    }

    const checkinResult = await sql`
      INSERT INTO qr_checkins (user_id, venue_id, qr_code, coins_earned)
      VALUES (${userId}, ${venueId}, ${qrCode}, ${QR_CHECKIN_COINS})
      RETURNING *
    `;

    await earnCoins(userId, QR_CHECKIN_COINS, 'venue_checkin', checkinResult.rows[0].id);

    return success({
      checkin: checkinResult.rows[0] as QRCheckin,
      coinsEarned: QR_CHECKIN_COINS,
    });
  } catch (error) {
    console.error('performQRCheckin error:', error);
    return failure('Failed to perform check-in', 'INTERNAL_ERROR');
  }
}
