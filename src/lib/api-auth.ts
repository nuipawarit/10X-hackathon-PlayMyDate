import { NextRequest, NextResponse } from 'next/server';
import { lucia } from './auth';

export async function withAuth(
  request: NextRequest,
  handler: (userId: string, sessionId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const sessionId = request.cookies.get(lucia.sessionCookieName)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const blankCookie = lucia.createBlankSessionCookie();
    response.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
    return response;
  }

  const result = await handler(user.id, session.id);

  if (session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    result.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }

  return result;
}

export async function getAuthUser(request: NextRequest): Promise<{ userId: string; sessionId: string } | null> {
  const sessionId = request.cookies.get(lucia.sessionCookieName)?.value;

  if (!sessionId) {
    return null;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user) {
    return null;
  }

  return { userId: user.id, sessionId: session.id };
}
