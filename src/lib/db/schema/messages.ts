import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { matches } from './matches';

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id')
    .notNull()
    .references(() => matches.id),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
