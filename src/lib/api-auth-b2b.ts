import { NextRequest, NextResponse } from 'next/server';
import { luciaB2B } from './auth-b2b';
import { sql } from './db';

export async function withB2BAuth(
  request: NextRequest,
  handler: (merchantId: string, userId: string, sessionId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const sessionId = request.cookies.get(luciaB2B.sessionCookieName)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { session, user } = await luciaB2B.validateSession(sessionId);

  if (!session || !user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const blankCookie = luciaB2B.createBlankSessionCookie();
    response.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
    return response;
  }

  const typedUser = user as unknown as { id: string; merchantId: string };
  const result = await handler(typedUser.merchantId, typedUser.id, session.id);

  if (session.fresh) {
    const sessionCookie = luciaB2B.createSessionCookie(session.id);
    result.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  return result;
}

export async function withB2BApiKey(
  request: NextRequest,
  handler: (merchantId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT id, status FROM merchants WHERE api_key = ${apiKey}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const merchant = result.rows[0];

    if (merchant.status !== 'active') {
      return NextResponse.json({ error: 'Merchant account is not active' }, { status: 403 });
    }

    return handler(merchant.id);
  } catch (error) {
    console.error('API key validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function getB2BAuthUser(
  request: NextRequest
): Promise<{ merchantId: string; userId: string; sessionId: string } | null> {
  const sessionId = request.cookies.get(luciaB2B.sessionCookieName)?.value;

  if (!sessionId) {
    return null;
  }

  const { session, user } = await luciaB2B.validateSession(sessionId);

  if (!session || !user) {
    return null;
  }

  const typedUser = user as unknown as { id: string; merchantId: string };
  return { merchantId: typedUser.merchantId, userId: typedUser.id, sessionId: session.id };
}
