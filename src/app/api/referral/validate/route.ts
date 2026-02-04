import { NextRequest, NextResponse } from 'next/server';
import { validateReferralCode } from '@/lib/services/referral';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const result = await validateReferralCode(code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      referrerName: result.data.displayName || 'A PlayMyDate user',
    });
  } catch (error) {
    console.error('Validate referral API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
