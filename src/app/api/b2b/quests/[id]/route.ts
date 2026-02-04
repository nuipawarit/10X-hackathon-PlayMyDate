import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getQuestByIdForMerchant, updateQuest, deleteQuest } from '@/lib/services/quest';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;

    const result = await getQuestByIdForMerchant(id, merchantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ quest: result.data });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;
    const body = await request.json();

    const result = await updateQuest(id, merchantId, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ quest: result.data });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;

    const result = await deleteQuest(id, merchantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  });
}
