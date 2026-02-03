import { pgTable, uuid, varchar, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { matches } from './matches';

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  intimacyPoints: integer('intimacy_points').notNull().default(0),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityInstances = pgTable('activity_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => activities.id),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  progress: jsonb('progress').$type<Record<string, unknown>>().default({}),
  result: jsonb('result').$type<Record<string, unknown> | null>(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
