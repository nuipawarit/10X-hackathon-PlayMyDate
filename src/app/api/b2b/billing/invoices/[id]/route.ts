import { NextRequest, NextResponse } from 'next/server';
import { withB2BAuth } from '@/lib/api-auth-b2b';
import { getInvoiceFromCampaign } from '@/lib/services/billing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withB2BAuth(request, async (merchantId) => {
    const { id } = await params;

    const result = await getInvoiceFromCampaign(merchantId, id);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ invoice: result.data });
  });
}
