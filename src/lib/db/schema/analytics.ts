import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, decimal, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';
import { merchants, campaigns } from './b2b';

export const userBehavioralProfiles = pgTable('user_behavioral_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => users.id),
  personaType: varchar('persona_type', { length: 50 }),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }).default('0'),
  activityPatterns: jsonb('activity_patterns').$type<Record<string, unknown>>(),
  preferences: jsonb('preferences').$type<Record<string, unknown>>(),
  lastAnalyzedAt: timestamp('last_analyzed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aggregatedInsights = pgTable('aggregated_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.id),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  insightType: varchar('insight_type', { length: 50 }).notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('aggregated_insights_merchant_id_idx').on(table.merchantId),
  index('aggregated_insights_period_idx').on(table.periodStart, table.periodEnd),
]);

export const campaignEvents = pgTable('campaign_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  userId: uuid('user_id').references(() => users.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventData: jsonb('event_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('campaign_events_campaign_id_idx').on(table.campaignId),
  index('campaign_events_user_id_idx').on(table.userId),
  index('campaign_events_event_type_idx').on(table.eventType),
  index('campaign_events_created_at_idx').on(table.createdAt),
]);

export const unlockHistory = pgTable('unlock_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id),
  unlockType: varchar('unlock_type', { length: 50 }).notNull(),
  milestone: integer('milestone'),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
}, (table) => [
  index('unlock_history_user_id_idx').on(table.userId),
  index('unlock_history_match_id_idx').on(table.matchId),
]);

export const analyticsReports = pgTable('analytics_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.id),
  reportType: varchar('report_type', { length: 50 }).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>(),
  data: jsonb('data').$type<Record<string, unknown>>(),
  status: varchar('status', { length: 20 }).default('pending'),
  generatedAt: timestamp('generated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('analytics_reports_merchant_id_idx').on(table.merchantId),
  index('analytics_reports_status_idx').on(table.status),
]);
