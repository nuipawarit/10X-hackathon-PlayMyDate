import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export interface AvatarConfig {
  style: 'cartoon' | 'realistic' | 'pixel';
  hairColor: string;
  hairStyle: string;
  skinTone: string;
  accessories: string[];
  background: string;
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  playingStyle: jsonb('playing_style').$type<string[]>().default([]),
  interests: jsonb('interests').$type<string[]>().default([]),
  bio: text('bio'),
  realName: varchar('real_name', { length: 100 }),
  photoUrl: text('photo_url'),
  occupation: varchar('occupation', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  avatarConfig: jsonb('avatar_config').$type<AvatarConfig>(),
  voiceNoteUrl: text('voice_note_url'),
  behavioralPersona: varchar('behavioral_persona', { length: 50 }),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  referralCode: varchar('referral_code', { length: 50 }).unique(),
  referredByUserId: uuid('referred_by_user_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});
