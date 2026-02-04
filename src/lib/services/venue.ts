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

export interface RecommendationFactors {
  matchId: string;
  preferredPriceRange?: number;
  preferredVenueTypes?: string[];
  preferredAmbiance?: string[];
}

const PERSONA_VENUE_PREFERENCES: Record<string, { venueTypes: string[]; ambiance: string[]; priceRange: number }> = {
  explorer: { venueTypes: ['activity', 'outdoor', 'unique'], ambiance: ['adventurous', 'exciting'], priceRange: 3 },
  connector: { venueTypes: ['cafe', 'restaurant', 'bar'], ambiance: ['cozy', 'intimate', 'romantic'], priceRange: 2 },
  achiever: { venueTypes: ['fine_dining', 'rooftop', 'exclusive'], ambiance: ['upscale', 'trendy'], priceRange: 4 },
  premium: { venueTypes: ['fine_dining', 'exclusive', 'spa'], ambiance: ['luxury', 'exclusive'], priceRange: 5 },
  casual: { venueTypes: ['cafe', 'casual_dining', 'park'], ambiance: ['relaxed', 'casual'], priceRange: 2 },
};

export async function getRecommendationsForMatch(
  matchId: string,
  limit: number = 5
): Promise<ServiceResult<DateVenue[]>> {
  try {
    const matchResult = await sql`
      SELECT
        m.*,
        u1.interests as user1_interests,
        u2.interests as user2_interests,
        ubp1.persona_type as user1_persona,
        ubp2.persona_type as user2_persona,
        ubp1.preferences as user1_preferences,
        ubp2.preferences as user2_preferences
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      LEFT JOIN user_behavioral_profiles ubp1 ON u1.id = ubp1.user_id
      LEFT JOIN user_behavioral_profiles ubp2 ON u2.id = ubp2.user_id
      WHERE m.id = ${matchId}
    `;

    if (matchResult.rows.length === 0) {
      return failure('Match not found', 'NOT_FOUND');
    }

    const match = matchResult.rows[0];
    const user1Persona = match.user1_persona || 'casual';
    const user2Persona = match.user2_persona || 'casual';

    const prefs1 = PERSONA_VENUE_PREFERENCES[user1Persona] || PERSONA_VENUE_PREFERENCES.casual;
    const prefs2 = PERSONA_VENUE_PREFERENCES[user2Persona] || PERSONA_VENUE_PREFERENCES.casual;

    const combinedVenueTypes = [...new Set([...prefs1.venueTypes, ...prefs2.venueTypes])];
    const combinedAmbiance = [...new Set([...prefs1.ambiance, ...prefs2.ambiance])];
    const avgPriceRange = Math.ceil((prefs1.priceRange + prefs2.priceRange) / 2);

    const result = await sql`
      SELECT *,
        CASE
          WHEN venue_type = ANY(${combinedVenueTypes as unknown as string}::text[]) THEN 20
          ELSE 0
        END +
        CASE
          WHEN price_range <= ${avgPriceRange} THEN 10
          ELSE 0
        END +
        COALESCE((rating::numeric * 10), 0) as recommendation_score
      FROM date_venues
      WHERE is_active = true AND booking_enabled = true
      ORDER BY recommendation_score DESC, rating DESC NULLS LAST, RANDOM()
      LIMIT ${limit}
    `;

    return success(result.rows as DateVenue[]);
  } catch (error) {
    console.error('getRecommendationsForMatch error:', error);
    return failure('Failed to get recommendations', 'INTERNAL_ERROR');
  }
}

export async function getSmartVenueRecommendations(
  userId: string,
  options: { matchId?: string; limit?: number } = {}
): Promise<ServiceResult<{ venues: DateVenue[]; reasons: Record<string, string> }>> {
  try {
    const { matchId, limit = 5 } = options;

    const userResult = await sql`
      SELECT u.*, ubp.persona_type, ubp.preferences
      FROM users u
      LEFT JOIN user_behavioral_profiles ubp ON u.id = ubp.user_id
      WHERE u.id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return failure('User not found', 'NOT_FOUND');
    }

    const user = userResult.rows[0];
    const persona = user.persona_type || 'casual';
    const prefs = PERSONA_VENUE_PREFERENCES[persona] || PERSONA_VENUE_PREFERENCES.casual;

    let partnerPersona = 'casual';
    if (matchId) {
      const matchResult = await sql`
        SELECT
          CASE WHEN m.user1_id = ${userId} THEN ubp2.persona_type ELSE ubp1.persona_type END as partner_persona
        FROM matches m
        LEFT JOIN user_behavioral_profiles ubp1 ON m.user1_id = ubp1.user_id
        LEFT JOIN user_behavioral_profiles ubp2 ON m.user2_id = ubp2.user_id
        WHERE m.id = ${matchId}
      `;
      if (matchResult.rows.length > 0 && matchResult.rows[0].partner_persona) {
        partnerPersona = matchResult.rows[0].partner_persona;
      }
    }

    const partnerPrefs = PERSONA_VENUE_PREFERENCES[partnerPersona] || PERSONA_VENUE_PREFERENCES.casual;
    const combinedTypes = [...new Set([...prefs.venueTypes, ...partnerPrefs.venueTypes])];

    const venues = await sql`
      SELECT * FROM date_venues
      WHERE is_active = true
        AND booking_enabled = true
        AND (venue_type = ANY(${combinedTypes as unknown as string}::text[]) OR rating::numeric >= 4)
      ORDER BY rating DESC NULLS LAST
      LIMIT ${limit}
    `;

    const reasons: Record<string, string> = {};
    for (const venue of venues.rows as DateVenue[]) {
      if (prefs.venueTypes.includes(venue.venue_type)) {
        reasons[venue.id] = `Matches your ${persona} style`;
      } else if (partnerPrefs.venueTypes.includes(venue.venue_type)) {
        reasons[venue.id] = `Your match might enjoy this`;
      } else if (parseFloat(venue.rating || '0') >= 4) {
        reasons[venue.id] = `Highly rated venue`;
      } else {
        reasons[venue.id] = `Popular choice`;
      }
    }

    return success({ venues: venues.rows as DateVenue[], reasons });
  } catch (error) {
    console.error('getSmartVenueRecommendations error:', error);
    return failure('Failed to get smart recommendations', 'INTERNAL_ERROR');
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

export async function getVenueByIdForMerchant(
  venueId: string,
  merchantId: string
): Promise<ServiceResult<DateVenue>> {
  try {
    const result = await sql`
      SELECT * FROM date_venues WHERE id = ${venueId} AND merchant_id = ${merchantId}
    `;

    if (result.rows.length === 0) {
      return failure('Venue not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as DateVenue);
  } catch (error) {
    console.error('getVenueByIdForMerchant error:', error);
    return failure('Failed to get venue', 'INTERNAL_ERROR');
  }
}

export interface UpdateVenueInput {
  name?: string;
  venueType?: string;
  description?: string;
  address?: string;
  locationLat?: string;
  locationLng?: string;
  priceRange?: number;
  cuisineType?: string;
  ambianceTags?: string[];
  openingHours?: Record<string, { open: string; close: string }>;
  bookingEnabled?: boolean;
  photos?: string[];
  rating?: string;
  isActive?: boolean;
}

export async function updateVenue(
  venueId: string,
  merchantId: string,
  data: UpdateVenueInput
): Promise<ServiceResult<DateVenue>> {
  try {
    const existing = await sql`
      SELECT id FROM date_venues WHERE id = ${venueId} AND merchant_id = ${merchantId}
    `;

    if (existing.rows.length === 0) {
      return failure('Venue not found', 'NOT_FOUND');
    }

    const result = await sql`
      UPDATE date_venues
      SET
        name = COALESCE(${data.name ?? null}, name),
        venue_type = COALESCE(${data.venueType ?? null}, venue_type),
        description = COALESCE(${data.description ?? null}, description),
        address = COALESCE(${data.address ?? null}, address),
        location_lat = COALESCE(${data.locationLat ?? null}, location_lat),
        location_lng = COALESCE(${data.locationLng ?? null}, location_lng),
        price_range = COALESCE(${data.priceRange ?? null}, price_range),
        cuisine_type = COALESCE(${data.cuisineType ?? null}, cuisine_type),
        ambiance_tags = COALESCE(${data.ambianceTags ? JSON.stringify(data.ambianceTags) : null}::jsonb, ambiance_tags),
        opening_hours = COALESCE(${data.openingHours ? JSON.stringify(data.openingHours) : null}::jsonb, opening_hours),
        booking_enabled = COALESCE(${data.bookingEnabled ?? null}, booking_enabled),
        photos = COALESCE(${data.photos ? JSON.stringify(data.photos) : null}::jsonb, photos),
        rating = COALESCE(${data.rating ?? null}, rating),
        is_active = COALESCE(${data.isActive ?? null}, is_active)
      WHERE id = ${venueId} AND merchant_id = ${merchantId}
      RETURNING *
    `;

    return success(result.rows[0] as DateVenue);
  } catch (error) {
    console.error('updateVenue error:', error);
    return failure('Failed to update venue', 'INTERNAL_ERROR');
  }
}

export async function deleteVenue(
  venueId: string,
  merchantId: string
): Promise<ServiceResult<{ success: boolean }>> {
  try {
    const result = await sql`
      UPDATE date_venues
      SET is_active = false
      WHERE id = ${venueId} AND merchant_id = ${merchantId}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return failure('Venue not found', 'NOT_FOUND');
    }

    return success({ success: true });
  } catch (error) {
    console.error('deleteVenue error:', error);
    return failure('Failed to delete venue', 'INTERNAL_ERROR');
  }
}
