import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getMerchantById, updateMerchant } from '@/lib/services/merchant';

export async function GET(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const result = await getMerchantById(merchantId);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ merchant: result.data });
  });
}

export async function PUT(request: NextRequest) {
  return withB2BAuth(request, async (merchantId) => {
    const body = await request.json();

    const result = await updateMerchant(merchantId, {
      name: body.name,
      businessType: body.businessType,
      description: body.description,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      address: body.address,
      logoUrl: body.logoUrl,
    });

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ merchant: result.data });
  });
}
