import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { lucia } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(lucia.sessionCookieName)?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null, session: null });
    }

    const { session, user } = await lucia.validateSession(sessionId);

    if (!session) {
      const blankCookie = lucia.createBlankSessionCookie();
      const response = NextResponse.json({ user: null, session: null });
      response.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
      return response;
    }

    const profileResult = await sql`
      SELECT id, email, display_name, playing_style, interests, bio, created_at, updated_at
      FROM users
      WHERE id = ${user.id}
    `;

    const profile = profileResult.rows[0] || null;

    const response = NextResponse.json({
      user: profile
        ? {
            id: profile.id,
            email: profile.email,
            displayName: profile.display_name,
            playingStyle: profile.playing_style || [],
            interests: profile.interests || [],
            bio: profile.bio,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          }
        : null,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });

    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    return response;
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
