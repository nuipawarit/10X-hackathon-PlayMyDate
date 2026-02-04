import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { luciaB2B, verifyPassword } from '@/lib/auth-b2b';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await sql`
      SELECT id, merchant_id, email, password_hash, display_name, role, is_active
      FROM merchant_users
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    const isValidPassword = await verifyPassword(user.password_hash, password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const session = await luciaB2B.createSession(user.id, {});
    const sessionCookie = luciaB2B.createSessionCookie(session.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        merchantId: user.merchant_id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    });

    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return response;
  } catch (error) {
    console.error('B2B login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
