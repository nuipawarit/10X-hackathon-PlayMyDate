import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { performDailyCheckin, getCheckinStatus } from '@/lib/services/checkin';

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const result = await getCheckinStatus(userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const result = await performDailyCheckin(userId);

    if (!result.success) {
      if (result.code === 'ALREADY_CHECKED_IN') {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  });
}
