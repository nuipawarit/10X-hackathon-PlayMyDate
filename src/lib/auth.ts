import { Lucia } from 'lucia';
import { NodePostgresAdapter } from '@lucia-auth/adapter-postgresql';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import { cache } from 'react';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const adapter = new NodePostgresAdapter(pool, {
  user: 'users',
  session: 'sessions',
});

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      displayName: attributes.display_name,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  display_name: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const { Argon2id } = await import('oslo/password');
  const hasher = new Argon2id();
  return hasher.hash(password);
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  const { Argon2id } = await import('oslo/password');
  const hasher = new Argon2id();
  return hasher.verify(storedHash, password);
}

export const validateRequest = cache(async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return { user: null, session: null };
  }

  const result = await lucia.validateSession(sessionId);

  try {
    if (result.session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!result.session) {
      const blankCookie = lucia.createBlankSessionCookie();
      cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
    }
  } catch {
    // Cookie setting may fail in some contexts
  }

  return result;
});
