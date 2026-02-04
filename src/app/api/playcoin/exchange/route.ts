import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { getExchangePartners, calculateExchangeRate, executeExchange } from '@/lib/services/exchange';

export async function GET() {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getExchangePartners();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ partners: result.data });
}

export async function POST(request: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.partnerId || !body.amount) {
    return NextResponse.json({ error: 'partnerId and amount are required' }, { status: 400 });
  }

  if (body.preview) {
    const rateResult = await calculateExchangeRate(body.partnerId, body.amount);

    if (!rateResult.success) {
      const status = rateResult.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: rateResult.error }, { status });
    }

    return NextResponse.json({ preview: rateResult.data });
  }

  const result = await executeExchange(user.id, body.partnerId, body.amount);

  if (!result.success) {
    const status = result.code === 'NOT_FOUND' ? 404 :
                   result.code === 'INSUFFICIENT_BALANCE' ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ exchange: result.data }, { status: 201 });
}
