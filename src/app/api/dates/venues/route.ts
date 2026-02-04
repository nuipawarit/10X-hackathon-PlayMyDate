import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { searchVenues } from '@/lib/services/venue';

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const { searchParams } = new URL(request.url);

    const filters = {
      venueType: searchParams.get('venueType') || undefined,
      priceRange: searchParams.get('priceRange') ? parseInt(searchParams.get('priceRange')!) : undefined,
      cuisineType: searchParams.get('cuisineType') || undefined,
      ambianceTag: searchParams.get('ambianceTag') || undefined,
      bookingEnabled: searchParams.get('bookingEnabled') === 'true' ? true : searchParams.get('bookingEnabled') === 'false' ? false : undefined,
    };

    const pagination = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await searchVenues(filters, pagination);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  });
}
