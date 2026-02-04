import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export interface DateVenue {
  id: string;
  merchant_id: string | null;
  name: string;
  venue_type: string;
  description: string | null;
  address: string | null;
  location_lat: string | null;
  location_lng: string | null;
  price_range: number | null;
  cuisine_type: string | null;
  ambiance_tags: string[] | null;
  opening_hours: Record<string, { open: string; close: string }> | null;
  booking_enabled: boolean;
  photos: string[] | null;
  rating: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface VenueSearchFilters {
  venueType?: string;
  priceRange?: number;
  cuisineType?: string;
  ambianceTag?: string;
  bookingEnabled?: boolean;
}

export interface VenueSearchResult {
  venues: DateVenue[];
  total: number;
}

export async function searchVenues(
  filters: VenueSearchFilters,
  pagination: { limit: number; offset: number } = { limit: 20, offset: 0 }
): Promise<ServiceResult<VenueSearchResult>> {
  try {
    let whereConditions = ['is_active = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.venueType) {
      whereConditions.push(`venue_type = $${paramIndex++}`);
      params.push(filters.venueType);
    }

    if (filters.priceRange) {
      whereConditions.push(`price_range <= $${paramIndex++}`);
      params.push(filters.priceRange);
    }

    if (filters.cuisineType) {
      whereConditions.push(`cuisine_type = $${paramIndex++}`);
      params.push(filters.cuisineType);
    }

    if (filters.ambianceTag) {
      whereConditions.push(`ambiance_tags @> $${paramIndex++}::jsonb`);
      params.push(JSON.stringify([filters.ambianceTag]));
    }

    if (filters.bookingEnabled !== undefined) {
      whereConditions.push(`booking_enabled = $${paramIndex++}`);
      params.push(filters.bookingEnabled);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await sql.query(
      `SELECT COUNT(*) as total FROM date_venues WHERE ${whereClause}`,
      params
    );

    const result = await sql.query(
      `SELECT * FROM date_venues WHERE ${whereClause} ORDER BY rating DESC NULLS LAST, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, pagination.limit, pagination.offset]
    );

    return success({
      venues: result.rows as DateVenue[],
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    console.error('searchVenues error:', error);
    return failure('Failed to search venues', 'INTERNAL_ERROR');
  }
}

export async function getVenueById(venueId: string): Promise<ServiceResult<DateVenue>> {
  try {
    const result = await sql`
      SELECT * FROM date_venues WHERE id = ${venueId} AND is_active = true
    `;

    if (result.rows.length === 0) {
      return failure('Venue not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as DateVenue);
  } catch (error) {
    console.error('getVenueById error:', error);
    return failure('Failed to get venue', 'INTERNAL_ERROR');
  }
}

export async function getRecommendationsForMatch(
  matchId: string,
  limit: number = 5
): Promise<ServiceResult<DateVenue[]>> {
  try {
    const matchResult = await sql`
      SELECT m.*, u1.interests as user1_interests, u2.interests as user2_interests
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE m.id = ${matchId}
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const result = await sql`
      SELECT * FROM date_venues
      WHERE is_active = true AND booking_enabled = true
      ORDER BY rating DESC NULLS LAST, RANDOM()
      LIMIT ${limit}
    `;

    return success(result.rows as DateVenue[]);
  } catch (error) {
    console.error('getRecommendationsForMatch error:', error);
    return failure('Failed to get recommendations', 'INTERNAL_ERROR');
  }
}

export async function getVenuesByMerchant(merchantId: string): Promise<ServiceResult<DateVenue[]>> {
  try {
    const result = await sql`
      SELECT * FROM date_venues WHERE merchant_id = ${merchantId} ORDER BY created_at DESC
    `;

    return success(result.rows as DateVenue[]);
  } catch (error) {
    console.error('getVenuesByMerchant error:', error);
    return failure('Failed to get merchant venues', 'INTERNAL_ERROR');
  }
}

export async function createVenue(
  merchantId: string,
  data: Omit<DateVenue, 'id' | 'merchant_id' | 'created_at'>
): Promise<ServiceResult<DateVenue>> {
  try {
    const result = await sql`
      INSERT INTO date_venues (
        merchant_id, name, venue_type, description, address,
        location_lat, location_lng, price_range, cuisine_type,
        ambiance_tags, opening_hours, booking_enabled, photos, rating, is_active
      )
      VALUES (
        ${merchantId}, ${data.name}, ${data.venue_type}, ${data.description}, ${data.address},
        ${data.location_lat}, ${data.location_lng}, ${data.price_range}, ${data.cuisine_type},
        ${data.ambiance_tags ? JSON.stringify(data.ambiance_tags) : null}::jsonb,
        ${data.opening_hours ? JSON.stringify(data.opening_hours) : null}::jsonb,
        ${data.booking_enabled ?? true}, ${data.photos ? JSON.stringify(data.photos) : null}::jsonb,
        ${data.rating}, ${data.is_active ?? true}
      )
      RETURNING *
    `;

    return success(result.rows[0] as DateVenue);
  } catch (error) {
    console.error('createVenue error:', error);
    return failure('Failed to create venue', 'INTERNAL_ERROR');
  }
}
