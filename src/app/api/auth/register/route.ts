import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { lucia, hashPassword } from '@/lib/auth';
import crypto from 'crypto';
import { generateReferralCode, applyReferral } from '@/lib/services/referral';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, referralCode } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await sql`
      INSERT INTO users (id, email, password_hash, display_name)
      VALUES (${userId}, ${email}, ${passwordHash}, ${displayName || null})
    `;

    await generateReferralCode(userId, displayName);

    if (referralCode) {
      await applyReferral(userId, referralCode);
    }

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const response = NextResponse.json({
      user: {
        id: userId,
        email,
        displayName: displayName || null,
      },
    }, { status: 201 });

    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
