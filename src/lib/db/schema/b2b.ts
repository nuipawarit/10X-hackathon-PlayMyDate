import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, decimal, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';
import { activities } from './activities';

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  businessType: varchar('business_type', { length: 50 }).notNull(),
  description: text('description'),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 50 }),
  address: text('address'),
  logoUrl: text('logo_url'),
  status: varchar('status', { length: 20 }).default('pending'),
  tier: varchar('tier', { length: 20 }).default('basic'),
  apiKey: varchar('api_key', { length: 255 }).unique(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const merchantUsers = pgTable('merchant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.id),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }),
  role: varchar('role', { length: 20 }).default('staff'),
  permissions: jsonb('permissions').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const merchantSessions = pgTable('merchant_sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => merchantUsers.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  spent: decimal('spent', { precision: 10, scale: 2 }).default('0'),
  cpaRate: decimal('cpa_rate', { precision: 10, scale: 2 }),
  cpmiRate: decimal('cpmi_rate', { precision: 10, scale: 2 }),
  targetAudience: jsonb('target_audience').$type<Record<string, unknown>>(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 20 }).default('draft'),
  metrics: jsonb('metrics').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const brandedQuests = pgTable('branded_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => activities.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  coinReward: integer('coin_reward').default(0),
  voucherRewardId: uuid('voucher_reward_id'),
  maxCompletions: integer('max_completions'),
  completionCount: integer('completion_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questCompletions = pgTable(
  'quest_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandedQuestId: uuid('branded_quest_id')
      .notNull()
      .references(() => brandedQuests.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id),
    completedAt: timestamp('completed_at').defaultNow().notNull(),
    rewardGranted: boolean('reward_granted').default(false),
  },
  (table) => [unique().on(table.brandedQuestId, table.userId)]
);
