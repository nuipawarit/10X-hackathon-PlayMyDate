import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getCampaignById, updateCampaign, updateCampaignStatus } from '@/lib/services/campaign';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;
    const result = await getCampaignById(id, merchantId);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ campaign: result.data });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;
    const body = await request.json();

    if (body.status) {
      const result = await updateCampaignStatus(id, merchantId, body.status);

      if (!result.success) {
        const status = result.code === 'NOT_FOUND' ? 404
          : result.code === 'INVALID_STATUS_TRANSITION' ? 400
          : 500;
        return NextResponse.json({ error: result.error }, { status });
      }

      return NextResponse.json({ campaign: result.data });
    }

    const result = await updateCampaign(id, merchantId, {
      name: body.name,
      type: body.type,
      description: body.description,
      budget: body.budget,
      cpaRate: body.cpaRate,
      cpmiRate: body.cpmiRate,
      targetAudience: body.targetAudience,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ campaign: result.data });
  });
}
