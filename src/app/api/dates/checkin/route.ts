import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { performQRCheckin } from '@/lib/services/booking';

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const body = await request.json();

    if (!body.qrCode) {
      return NextResponse.json({ error: 'qrCode is required' }, { status: 400 });
    }

    const result = await performQRCheckin(userId, body.qrCode);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404
        : result.code === 'ALREADY_CHECKED_IN' ? 400
        : result.code === 'INVALID_QR_CODE' ? 400
        : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result.data);
  });
}
