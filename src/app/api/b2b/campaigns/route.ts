import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getCampaigns, createCampaign } from '@/lib/services/campaign';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const { searchParams } = new URL(request.url);

    const filters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
    };

    const pagination = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await getCampaigns(merchantId, filters, pagination);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  });
}

export async function POST(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const body = await request.json();

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 });
    }

    const result = await createCampaign(merchantId, {
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
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ campaign: result.data }, { status: 201 });
  });
}
