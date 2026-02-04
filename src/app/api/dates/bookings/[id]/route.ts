import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getBookingById, updateBookingStatus, cancelBooking, updateSplitBillPreference } from '@/lib/services/booking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const result = await getBookingById(id, userId);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ booking: result.data });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const result = await updateBookingStatus(id, userId, body.status);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ booking: result.data });
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const body = await request.json();

    if (body.splitBillPreference) {
      const result = await updateSplitBillPreference(id, userId, body.splitBillPreference);

      if (!result.success) {
        const status = result.code === 'NOT_FOUND' ? 404 : 500;
        return NextResponse.json({ error: result.error }, { status });
      }

      return NextResponse.json({ booking: result.data });
    }

    return NextResponse.json({ error: 'No valid update field provided' }, { status: 400 });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId) => {
    const { id } = await params;
    const result = await cancelBooking(id, userId);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ booking: result.data });
  });
}
