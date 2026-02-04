import { NextRequest, NextResponse } from 'next/server';
import { luciaB2B } from '@/lib/auth-b2b';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(luciaB2B.sessionCookieName)?.value;

    if (sessionId) {
      await luciaB2B.invalidateSession(sessionId);
    }

    const blankCookie = luciaB2B.createBlankSessionCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

    return response;
  } catch (error) {
    console.error('B2B logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
