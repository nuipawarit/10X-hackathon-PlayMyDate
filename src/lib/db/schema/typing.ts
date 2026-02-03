import { pgTable, uuid, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const typingStatus = pgTable(
  'typing_status',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    isTyping: boolean('is_typing').notNull().default(false),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.matchId, table.userId)]
);
