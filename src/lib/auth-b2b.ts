import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import { cache } from 'react';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const adapter = new NodePostgresAdapter(pool, {
  user: 'merchant_users',
  session: 'merchant_sessions',
});

export const luciaB2B = new Lucia(adapter, {
  sessionCookie: {
    name: 'b2b_session',
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      displayName: attributes.display_name,
      merchantId: attributes.merchant_id,
      role: attributes.role,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof luciaB2B;
    DatabaseUserAttributes: B2BDatabaseUserAttributes;
  }
}

interface B2BDatabaseUserAttributes {
  email: string;
  display_name: string | null;
  merchant_id: string;
  role: string;
}

export { hashPassword, verifyPassword } from './auth';

export const validateB2BRequest = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(luciaB2B.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return { user: null, session: null };
  }

  const result = await luciaB2B.validateSession(sessionId);

  try {
    if (result.session?.fresh) {
      const sessionCookie = luciaB2B.createSessionCookie(result.session.id);
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!result.session) {
      const blankCookie = luciaB2B.createBlankSessionCookie();
      cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
    }
  } catch {
    // Cookie setting may fail in some contexts
  }

  return result;
});
