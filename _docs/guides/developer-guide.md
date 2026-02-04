# PlayMyDate Developer Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 App Router + React 19 + shadcn/ui + Tailwind v4 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│              /api/* (B2C) + /api/b2b/* (B2B)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│                   /src/lib/services/*                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│              PostgreSQL (Neon) + Drizzle ORM                │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/     # B2C protected routes
│   │   ├── wallet/
│   │   ├── rewards/
│   │   ├── dates/
│   │   └── ...
│   ├── (b2b)/               # B2B portal
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── campaigns/
│   │   ├── analytics/
│   │   └── ...
│   └── api/
│       ├── auth/            # B2C auth
│       ├── users/
│       ├── matches/
│       ├── activities/
│       ├── messages/
│       ├── playcoin/
│       ├── dates/
│       ├── subscription/
│       ├── b2b/             # B2B APIs
│       │   ├── auth/
│       │   ├── merchant/
│       │   ├── campaigns/
│       │   ├── analytics/
│       │   └── billing/
│       └── webhooks/
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── wallet/
│   ├── rewards/
│   ├── paradise/
│   ├── b2b/
│   └── profile/
└── lib/
    ├── db/
    │   ├── schema/          # Drizzle schemas
    │   └── index.ts         # DB client
    ├── services/            # Business logic
    ├── validations/         # Zod schemas
    ├── auth.ts              # B2C Lucia auth
    ├── auth-b2b.ts          # B2B Lucia auth
    └── features.ts          # Feature flags
```

---

## Service Layer Pattern

All business logic lives in `/src/lib/services/`. API routes are thin wrappers.

### ServiceResult<T>

```typescript
// /src/lib/services/types.ts

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function failure(error: string, code: string): ServiceResult<never> {
  return { success: false, error, code };
}
```

### Example Service

```typescript
// /src/lib/services/example.ts
import { sql } from '@/lib/db';
import { success, failure, type ServiceResult } from './types';

export async function getItemById(id: string): Promise<ServiceResult<Item>> {
  try {
    const result = await sql`
      SELECT * FROM items WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return failure('Item not found', 'NOT_FOUND');
    }

    return success(result.rows[0] as Item);
  } catch (error) {
    console.error('getItemById error:', error);
    return failure('Failed to get item', 'INTERNAL_ERROR');
  }
}
```

### Using in API Routes

```typescript
// /src/app/api/items/[id]/route.ts
import { NextResponse } from 'next/server';
import { getItemById } from '@/lib/services/example';
import { getApiUser } from '@/lib/api-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await getApiUser();
  if (!authResult.success) {
    return NextResponse.json(authResult, { status: 401 });
  }

  const result = await getItemById(id);

  if (!result.success) {
    const status = result.code === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
```

---

## Database

### Drizzle ORM

Schemas are in `/src/lib/db/schema/`:

```typescript
// /src/lib/db/schema/example.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Running Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Push to database (development)
npx drizzle-kit push

# View schema diff
npx drizzle-kit check
```

### Raw SQL Queries

Use template literals for parameterized queries:

```typescript
import { sql } from '@/lib/db';

// Safe parameterized query
const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`;

// Dynamic queries (use sql.query)
const result = await sql.query(
  `SELECT * FROM users WHERE status = $1`,
  [status]
);
```

---

## Authentication

### B2C (Lucia)

```typescript
// /src/lib/auth.ts
import { getApiUser } from '@/lib/api-auth';

// In API routes
const authResult = await getApiUser();
if (!authResult.success) {
  return NextResponse.json(authResult, { status: 401 });
}

const user = authResult.data.user;
```

### B2B (Lucia with merchant context)

```typescript
// /src/lib/auth-b2b.ts
import { getB2BApiUser } from '@/lib/api-auth-b2b';

// In B2B API routes
const authResult = await getB2BApiUser();
if (!authResult.success) {
  return NextResponse.json(authResult, { status: 401 });
}

const { user, merchantId } = authResult.data;
```

---

## Key Domains

### PlayCoin System

Files:
- `/src/lib/services/playcoin.ts` - Wallet operations
- `/src/lib/services/checkin.ts` - Daily check-in
- `/src/lib/services/reward.ts` - Rewards
- `/src/lib/services/exchange.ts` - Partner exchange

Flow:
```
User Action → earnCoins/burnCoins → Transaction recorded → Wallet updated
```

### Matching System

Files:
- `/src/lib/services/matching.ts` - Match finding
- `/src/lib/services/behavioral.ts` - Persona analysis
- `/src/lib/services/chemistry.ts` - Chemistry scoring

Personas:
- `explorer` - Adventurous, likes new experiences
- `connector` - Social, values relationships
- `achiever` - Goal-oriented, competitive
- `casual` - Relaxed, low-pressure
- `premium` - Values quality and exclusivity

### Paradise Mode (Date Planning)

Files:
- `/src/lib/services/venue.ts` - Venue search + recommendations
- `/src/lib/services/booking.ts` - Booking management

Features:
- AI venue recommendations based on personas
- QR check-in for coins
- Split bill preferences

### B2B Analytics

Files:
- `/src/lib/services/analytics.ts` - Metrics + reports
- `/src/lib/services/tracking.ts` - Event tracking
- `/src/lib/services/campaign.ts` - Campaign management

Metrics tracked:
- Impressions, Clicks, Conversions
- Audience segments
- Conversion funnel

---

## Feature Flags

```typescript
// /src/lib/features.ts
export const features = {
  PLAYCOIN: process.env.FEATURE_PLAYCOIN === 'true',
  PARADISE_MODE: process.env.FEATURE_PARADISE_MODE === 'true',
  B2B: process.env.FEATURE_B2B === 'true',
};

// Usage
if (features.PLAYCOIN) {
  // Show PlayCoin features
}
```

---

## Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `NOT_FOUND` | Resource not found | 404 |
| `UNAUTHORIZED` | Not authenticated | 401 |
| `FORBIDDEN` | Not authorized | 403 |
| `VALIDATION_ERROR` | Invalid input | 400 |
| `INSUFFICIENT_BALANCE` | Not enough coins | 400 |
| `ALREADY_CHECKED_IN` | Already checked in today | 400 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Watch mode
npm test -- --watch
```

### API Testing with curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Get wallet (authenticated)
curl http://localhost:3000/api/playcoin/wallet \
  -b cookies.txt

# B2B Login
curl -X POST http://localhost:3000/api/b2b/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"merchant@example.com","password":"password"}' \
  -c b2b-cookies.txt
```

---

## Deployment

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=your-secret-key

# Feature Flags
FEATURE_PLAYCOIN=true
FEATURE_PARADISE_MODE=true
FEATURE_B2B=true

# Vercel Blob (voice notes)
BLOB_READ_WRITE_TOKEN=...

# Stripe (future)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Vercel Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check connection
npx drizzle-kit check

# Reset and reseed
npm run db:reset
npm run db:seed
```

### Auth Issues

1. Clear cookies
2. Check session expiry
3. Verify AUTH_SECRET matches

### Type Errors

```bash
# Regenerate types
npx drizzle-kit generate

# Check TypeScript
npx tsc --noEmit
```
