import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getVenueByIdForMerchant, updateVenue, deleteVenue } from '@/lib/services/venue';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;

    const result = await getVenueByIdForMerchant(id, merchantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ venue: result.data });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;
    const body = await request.json();

    const result = await updateVenue(id, merchantId, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ venue: result.data });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;

    const result = await deleteVenue(id, merchantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  });
}
