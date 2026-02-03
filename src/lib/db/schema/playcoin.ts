import { pgTable, uuid, varchar, text, integer, timestamp, jsonb, boolean, date, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const playcoinWallets = pgTable('playcoin_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .unique()
    .notNull()
    .references(() => users.id),
  balance: integer('balance').default(0),
  lifetimeEarned: integer('lifetime_earned').default(0),
  lifetimeSpent: integer('lifetime_spent').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const playcoinTransactions = pgTable('playcoin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => playcoinWallets.id),
  type: varchar('type', { length: 20 }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  source: varchar('source', { length: 50 }),
  referenceId: uuid('reference_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dailyCheckins = pgTable(
  'daily_checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    checkinDate: date('checkin_date').notNull(),
    streakCount: integer('streak_count').default(1),
    coinsEarned: integer('coins_earned'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.checkinDate)]
);

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  coinCost: integer('coin_cost').notNull(),
  stockQuantity: integer('stock_quantity'),
  partnerId: uuid('partner_id'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRewards = pgTable('user_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => rewards.id),
  transactionId: uuid('transaction_id').references(() => playcoinTransactions.id),
  status: varchar('status', { length: 20 }).default('redeemed'),
  redeemedAt: timestamp('redeemed_at').defaultNow(),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at'),
});
