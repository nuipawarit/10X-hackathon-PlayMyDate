import { NextRequest, NextResponse } from 'next/server';
import { luciaB2B } from '@/lib/auth-b2b';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(luciaB2B.sessionCookieName)?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null });
    }

    const { session, user } = await luciaB2B.validateSession(sessionId);

    if (!session || !user) {
      const response = NextResponse.json({ user: null });
      const blankCookie = luciaB2B.createBlankSessionCookie();
      response.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
      return response;
    }

    const merchantResult = await sql`
      SELECT name, status, tier FROM merchants WHERE id = ${user.merchantId}
    `;

    const merchant = merchantResult.rows[0] || null;

    const response = NextResponse.json({
      user: {
        id: user.id,
        merchantId: user.merchantId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      merchant: merchant ? {
        name: merchant.name,
        status: merchant.status,
        tier: merchant.tier,
      } : null,
    });

    if (session.fresh) {
      const sessionCookie = luciaB2B.createSessionCookie(session.id);
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    return response;
  } catch (error) {
    console.error('B2B session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
