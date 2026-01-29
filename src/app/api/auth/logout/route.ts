import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(lucia.sessionCookieName)?.value;

    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }

    const blankCookie = lucia.createBlankSessionCookie();

    const response = NextResponse.json({ success: true });
    response.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
