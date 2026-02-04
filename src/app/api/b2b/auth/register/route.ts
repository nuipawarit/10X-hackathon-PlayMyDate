import { NextRequest, NextResponse } from 'next/server';
import { luciaB2B } from '@/lib/auth-b2b';
import { createMerchant, createMerchantUser } from '@/lib/services/merchant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      businessType,
      contactEmail,
      contactPhone,
      adminEmail,
      adminPassword,
      adminDisplayName,
    } = body;

    if (!businessName || !businessType || !contactEmail || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const merchantResult = await createMerchant({
      name: businessName,
      businessType,
      contactEmail,
      contactPhone,
    });

    if (!merchantResult.success) {
      return NextResponse.json(
        { error: merchantResult.error },
        { status: merchantResult.code === 'DUPLICATE_EMAIL' ? 409 : 500 }
      );
    }

    const merchant = merchantResult.data;

    const userResult = await createMerchantUser(merchant.id, {
      email: adminEmail,
      password: adminPassword,
      displayName: adminDisplayName,
      role: 'admin',
    });

    if (!userResult.success) {
      return NextResponse.json(
        { error: userResult.error },
        { status: userResult.code === 'DUPLICATE_EMAIL' ? 409 : 500 }
      );
    }

    const user = userResult.data;

    const session = await luciaB2B.createSession(user.id, {});
    const sessionCookie = luciaB2B.createSessionCookie(session.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        merchantId: merchant.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
      merchant: {
        id: merchant.id,
        name: merchant.name,
        status: merchant.status,
      },
    });

    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return response;
  } catch (error) {
    console.error('B2B registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
