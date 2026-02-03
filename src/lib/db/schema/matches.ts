import { pgTable, uuid, decimal, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user1Id: uuid('user1_id')
      .notNull()
      .references(() => users.id),
    user2Id: uuid('user2_id')
      .notNull()
      .references(() => users.id),
    compatibilityScore: decimal('compatibility_score', { precision: 5, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('matched'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.user1Id, table.user2Id)]
);
