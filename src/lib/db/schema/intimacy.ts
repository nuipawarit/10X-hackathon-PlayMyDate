import { pgTable, uuid, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { matches } from './matches';

export const intimacyScores = pgTable('intimacy_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id)
    .unique(),
  score: integer('score').notNull().default(0),
  unlocks: jsonb('unlocks').$type<string[]>().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const INTIMACY_THRESHOLDS = {
  real_name: 25,
  photo: 45,
  occupation: 65,
  call: 85,
} as const;
