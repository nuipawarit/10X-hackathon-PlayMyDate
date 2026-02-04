import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getVenuesByMerchant, createVenue } from '@/lib/services/venue';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const result = await getVenuesByMerchant(merchantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ venues: result.data });
  });
}

export async function POST(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const body = await request.json();

    if (!body.name || !body.venueType) {
      return NextResponse.json({ error: 'name and venueType are required' }, { status: 400 });
    }

    const result = await createVenue(merchantId, {
      name: body.name,
      venue_type: body.venueType,
      description: body.description || null,
      address: body.address || null,
      location_lat: body.locationLat || null,
      location_lng: body.locationLng || null,
      price_range: body.priceRange || null,
      cuisine_type: body.cuisineType || null,
      ambiance_tags: body.ambianceTags || null,
      opening_hours: body.openingHours || null,
      booking_enabled: body.bookingEnabled ?? true,
      photos: body.photos || null,
      rating: body.rating || null,
      is_active: body.isActive ?? true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ venue: result.data }, { status: 201 });
  });
}
