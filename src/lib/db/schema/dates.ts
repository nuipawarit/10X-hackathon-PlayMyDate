import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, decimal, time, date, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const dateVenues = pgTable('date_venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id'),
  name: varchar('name', { length: 255 }).notNull(),
  venueType: varchar('venue_type', { length: 50 }).notNull(),
  description: text('description'),
  address: text('address'),
  locationLat: decimal('location_lat', { precision: 10, scale: 7 }),
  locationLng: decimal('location_lng', { precision: 10, scale: 7 }),
  priceRange: integer('price_range'),
  cuisineType: varchar('cuisine_type', { length: 50 }),
  ambianceTags: jsonb('ambiance_tags').$type<string[]>(),
  openingHours: jsonb('opening_hours').$type<Record<string, { open: string; close: string }>>(),
  bookingEnabled: boolean('booking_enabled').default(true),
  photos: jsonb('photos').$type<string[]>(),
  rating: decimal('rating', { precision: 2, scale: 1 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dateBookings = pgTable('date_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id),
  venueId: uuid('venue_id')
    .notNull()
    .references(() => dateVenues.id),
  initiatedByUserId: uuid('initiated_by_user_id')
    .notNull()
    .references(() => users.id),
  bookingDate: date('booking_date').notNull(),
  bookingTime: time('booking_time').notNull(),
  partySize: integer('party_size').default(2),
  specialRequests: text('special_requests'),
  confirmationCode: varchar('confirmation_code', { length: 50 }).unique(),
  status: varchar('status', { length: 20 }).default('pending'),
  voucherAppliedId: uuid('voucher_applied_id'),
  splitBillPreference: varchar('split_bill_preference', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const qrCheckins = pgTable(
  'qr_checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => dateVenues.id),
    bookingId: uuid('booking_id').references(() => dateBookings.id),
    qrCode: varchar('qr_code', { length: 255 }).notNull(),
    coinsEarned: integer('coins_earned').default(0),
    checkedInAt: timestamp('checked_in_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.venueId, table.bookingId)]
);
