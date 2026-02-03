# Implementation Checklist v2 - PlayMyDate Upgrade

> **Version:** 2.0
> **วันที่:** กุมภาพันธ์ 2026
> **อ้างอิง:** SDD v2, Implementation Plan

---

## Phase 0: Foundation Setup (2-3 สัปดาห์)

### 0.1 Drizzle ORM Setup

- [x] Install dependencies: `drizzle-orm`, `drizzle-kit`, `zod`
- [x] Create directory structure: `/src/lib/db/schema/`
- [x] Create Drizzle schema for `users` table
- [x] Create Drizzle schema for `sessions` table
- [x] Create Drizzle schema for `matches` table
- [x] Create Drizzle schema for `messages` table
- [x] Create Drizzle schema for `activities` table
- [x] Create Drizzle schema for `activity_instances` table
- [x] Create Drizzle schema for `intimacy_scores` table
- [x] Create Drizzle schema for `typing_status` table
- [x] Create `/src/lib/db/index.ts` - Drizzle client export
- [x] Configure `drizzle.config.ts` for Neon PostgreSQL
- [x] Test Drizzle queries work alongside existing raw SQL

### 0.2 shadcn/ui Setup

- [x] Initialize shadcn/ui: `npx shadcn@latest init`
- [x] Configure for Tailwind v4
- [x] Add Button component
- [x] Add Card component
- [x] Add Input component
- [x] Add Form component
- [x] Add Dialog component
- [x] Add Sheet component
- [x] Add Tabs component
- [x] Add Avatar component
- [x] Add Badge component
- [x] Add Progress component
- [x] Add Toast component
- [x] Add Alert component

### 0.3 Service Layer Pattern

- [x] Create `/src/lib/services/` directory
- [x] Create `/src/lib/services/user.ts` - Extract from existing API routes
- [x] Create `/src/lib/services/matching.ts` - Extract from existing API routes
- [x] Create `/src/lib/services/activity.ts` - Extract from existing API routes
- [x] Create `/src/lib/services/communication.ts` - Extract from existing API routes
- [x] Create `/src/lib/services/intimacy.ts` - Extract from existing API routes
- [x] Create `/src/lib/validations/` directory
- [x] Create Zod schemas for API requests
- [x] Standardize API response format: `{ success, data/error }`

### 0.4 Feature Flags

- [x] Create `/src/lib/features.ts`
- [x] Add `FEATURE_PLAYCOIN` flag
- [x] Add `FEATURE_PARADISE_MODE` flag
- [x] Add `FEATURE_B2B` flag
- [x] Add environment variable configuration

---

## Phase 1: Core B2C + PlayCoin MVP (8-12 สัปดาห์)

### 1.1 Database Schema Enhancement

#### Users Table

- [ ] Add `avatar_config` JSONB column
- [ ] Add `voice_note_url` TEXT column
- [ ] Add `behavioral_persona` VARCHAR(50) column
- [ ] Add `subscription_tier` VARCHAR(20) DEFAULT 'free'
- [ ] Add `subscription_expires_at` TIMESTAMP column
- [ ] Add `referral_code` VARCHAR(50) UNIQUE column
- [ ] Add `referred_by_user_id` UUID FK column
- [ ] Add `is_active` BOOLEAN DEFAULT true column
- [ ] Create index on `referral_code`
- [ ] Update Drizzle schema for users

#### Matches Table

- [ ] Add `chemistry_score` INTEGER DEFAULT 0 column
- [ ] Add `mission_streak` INTEGER DEFAULT 0 column
- [ ] Add `paradise_mode_unlocked` BOOLEAN DEFAULT false column
- [ ] Add `paradise_mode_unlocked_at` TIMESTAMP column
- [ ] Add `last_activity_at` TIMESTAMP DEFAULT NOW() column
- [ ] Create index on `status`
- [ ] Update Drizzle schema for matches

#### Activities Table

- [ ] Add `coin_reward` INTEGER DEFAULT 0 column
- [ ] Add `difficulty_level` INTEGER DEFAULT 1 column
- [ ] Add `estimated_duration_minutes` INTEGER DEFAULT 10 column
- [ ] Add `is_branded` BOOLEAN DEFAULT false column
- [ ] Add `sponsor_merchant_id` UUID column (FK added later)
- [ ] Update Drizzle schema for activities

#### Activity Instances Table

- [ ] Add `coins_earned` INTEGER DEFAULT 0 column
- [ ] Add `expires_at` TIMESTAMP column
- [ ] Update Drizzle schema for activity_instances

#### Messages Table

- [ ] Add `message_type` VARCHAR(20) DEFAULT 'text' column
- [ ] Add `read_at` TIMESTAMP column
- [ ] Update Drizzle schema for messages

### 1.2 PlayCoin Domain - New Tables

- [ ] Create `playcoin_wallets` table
  - `id` UUID PK
  - `user_id` UUID UNIQUE FK
  - `balance` INTEGER DEFAULT 0
  - `lifetime_earned` INTEGER DEFAULT 0
  - `lifetime_spent` INTEGER DEFAULT 0
  - `created_at`, `updated_at` TIMESTAMP
- [ ] Create `playcoin_transactions` table
  - `id` UUID PK
  - `wallet_id` UUID FK
  - `type` VARCHAR(20) (earn, burn, purchase, exchange)
  - `amount` INTEGER
  - `balance_after` INTEGER
  - `source` VARCHAR(50)
  - `reference_id` UUID
  - `metadata` JSONB
  - `created_at` TIMESTAMP
- [ ] Create `daily_checkins` table
  - `id` UUID PK
  - `user_id` UUID FK
  - `checkin_date` DATE
  - `streak_count` INTEGER DEFAULT 1
  - `coins_earned` INTEGER
  - `created_at` TIMESTAMP
  - UNIQUE(user_id, checkin_date)
- [ ] Create `rewards` table
  - `id` UUID PK
  - `name` VARCHAR(255)
  - `description` TEXT
  - `type` VARCHAR(50) (powerup, avatar_item, voucher, partner_exchange)
  - `coin_cost` INTEGER
  - `stock_quantity` INTEGER
  - `partner_id` UUID
  - `is_active` BOOLEAN
  - `metadata` JSONB
  - `created_at` TIMESTAMP
- [ ] Create `user_rewards` table
  - `id` UUID PK
  - `user_id` UUID FK
  - `reward_id` UUID FK
  - `transaction_id` UUID FK
  - `status` VARCHAR(20) (redeemed, used, expired)
  - `redeemed_at`, `used_at`, `expires_at` TIMESTAMP
- [ ] Create Drizzle schema: `/src/lib/db/schema/playcoin.ts`
- [ ] Create indexes for all new tables
- [ ] Initialize wallets for existing users (migration script)

### 1.3 PlayCoin Services

- [ ] Create `/src/lib/services/playcoin.ts`
  - [ ] `getWallet(userId)` - Get user wallet
  - [ ] `earnCoins(userId, amount, source, referenceId)` - Add coins
  - [ ] `burnCoins(userId, amount, source, referenceId)` - Deduct coins
  - [ ] `getTransactionHistory(userId, pagination)` - List transactions
- [ ] Create `/src/lib/services/checkin.ts`
  - [ ] `performDailyCheckin(userId)` - Execute daily check-in
  - [ ] `getCheckinStatus(userId)` - Get today's status + streak
  - [ ] `calculateStreakBonus(streakCount)` - Calculate bonus coins
- [ ] Create `/src/lib/services/reward.ts`
  - [ ] `getRewardCatalog(filters)` - List available rewards
  - [ ] `redeemReward(userId, rewardId)` - Redeem a reward
  - [ ] `getUserRewards(userId)` - List user's redeemed rewards

### 1.4 PlayCoin API Routes

- [ ] Create `GET /api/playcoin/wallet/route.ts` - Get wallet balance
- [ ] Create `GET /api/playcoin/transactions/route.ts` - Transaction history
- [ ] Create `POST /api/playcoin/checkin/route.ts` - Daily check-in
- [ ] Create `GET /api/playcoin/rewards/route.ts` - Reward catalog
- [ ] Create `POST /api/playcoin/redeem/route.ts` - Redeem reward
- [ ] Create `GET /api/playcoin/user-rewards/route.ts` - User's rewards

### 1.5 Chemistry Meter Enhancement

- [ ] Create `/src/lib/services/chemistry.ts`
  - [ ] `calculateChemistryScore(matchId)` - Calculate score from interactions
  - [ ] `updateChemistryOnAction(matchId, actionType)` - Update on action
  - [ ] `applyChemistryDecay(matchId)` - Apply decay for inactivity
  - [ ] `checkUnlockEligibility(matchId)` - Check unlock thresholds
- [ ] Update `/api/activities/complete/route.ts`
  - [ ] Award coins on completion
  - [ ] Update chemistry score
  - [ ] Track mission streaks
- [ ] Create chemistry decay background job (Vercel CRON)

### 1.6 Daily Missions System

- [ ] Create mission assignment logic
  - [ ] Assign 3 missions per match daily
  - [ ] Rotate missions each day
  - [ ] Track completion status
- [ ] Create `GET /api/activities/daily-missions/route.ts`
- [ ] Update activity completion for mission tracking
- [ ] Implement streak bonus calculation

### 1.7 Avatar Builder

- [ ] Define AvatarConfig TypeScript interface
- [ ] Create `POST /api/users/avatar/route.ts` - Save avatar
- [ ] Create `GET /api/users/avatar/route.ts` - Get avatar
- [ ] Create `/src/components/profile/AvatarBuilder.tsx`
- [ ] Add avatar builder to profile page

### 1.8 Frontend Updates - Phase 1

#### Wallet Components

- [ ] Create `/src/components/wallet/WalletBalance.tsx`
- [ ] Create `/src/components/wallet/TransactionHistory.tsx`
- [ ] Create `/src/components/wallet/DailyCheckin.tsx`
- [ ] Create `/src/components/wallet/StreakIndicator.tsx`
- [ ] Create `/src/components/wallet/index.ts`

#### Reward Components

- [ ] Create `/src/components/rewards/RewardCatalog.tsx`
- [ ] Create `/src/components/rewards/RewardCard.tsx`
- [ ] Create `/src/components/rewards/RedeemConfirmation.tsx`
- [ ] Create `/src/components/rewards/index.ts`

#### New Pages

- [ ] Create `/src/app/(authenticated)/wallet/page.tsx`
- [ ] Create `/src/app/(authenticated)/rewards/page.tsx`

#### Update Existing

- [ ] Add chemistry meter to match detail page
- [ ] Add coin rewards display to activity completion
- [ ] Update profile page with avatar builder
- [ ] Add wallet balance to header/layout

---

## Phase 2: Paradise Mode + B2B Basics (6-8 สัปดาห์)

### 2.1 Date Planning Domain - Tables

- [ ] Create `date_venues` table
  - `id` UUID PK
  - `merchant_id` UUID (FK added later)
  - `name` VARCHAR(255)
  - `venue_type` VARCHAR(50)
  - `description` TEXT
  - `address` TEXT
  - `location_lat`, `location_lng` DECIMAL
  - `price_range` INTEGER
  - `cuisine_type` VARCHAR(50)
  - `ambiance_tags` JSONB
  - `opening_hours` JSONB
  - `booking_enabled` BOOLEAN
  - `photos` JSONB
  - `rating` DECIMAL
  - `is_active` BOOLEAN
  - `created_at` TIMESTAMP
- [ ] Create `date_bookings` table
  - `id` UUID PK
  - `match_id` UUID FK
  - `venue_id` UUID FK
  - `initiated_by_user_id` UUID FK
  - `booking_date` DATE
  - `booking_time` TIME
  - `party_size` INTEGER
  - `special_requests` TEXT
  - `confirmation_code` VARCHAR(50) UNIQUE
  - `status` VARCHAR(20)
  - `voucher_applied_id` UUID FK
  - `split_bill_preference` VARCHAR(20)
  - `created_at`, `updated_at` TIMESTAMP
- [ ] Create `qr_checkins` table
  - `id` UUID PK
  - `user_id` UUID FK
  - `venue_id` UUID FK
  - `booking_id` UUID FK (optional)
  - `qr_code` VARCHAR(255)
  - `coins_earned` INTEGER
  - `checked_in_at` TIMESTAMP
- [ ] Create Drizzle schema: `/src/lib/db/schema/dates.ts`
- [ ] Create indexes

### 2.2 Date Planning Services

- [ ] Create `/src/lib/services/venue.ts`
  - [ ] `searchVenues(filters, pagination)` - Search with filters
  - [ ] `getVenueById(venueId)` - Get venue details
  - [ ] `getRecommendationsForMatch(matchId)` - AI recommendations
- [ ] Create `/src/lib/services/booking.ts`
  - [ ] `createBooking(data)` - Create new booking
  - [ ] `getBookingById(bookingId)` - Get booking details
  - [ ] `getUserBookings(userId)` - List user bookings
  - [ ] `updateBookingStatus(bookingId, status)` - Update status
  - [ ] `cancelBooking(bookingId, userId)` - Cancel booking
  - [ ] `performQRCheckin(userId, qrCode)` - QR check-in

### 2.3 Date Planning API Routes

- [ ] Create `GET /api/dates/venues/route.ts` - Search venues
- [ ] Create `GET /api/dates/venues/[id]/route.ts` - Venue details
- [ ] Create `GET /api/dates/recommendations/route.ts` - Recommendations
- [ ] Create `GET /api/dates/bookings/route.ts` - List bookings
- [ ] Create `POST /api/dates/bookings/route.ts` - Create booking
- [ ] Create `GET /api/dates/bookings/[id]/route.ts` - Booking details
- [ ] Create `PUT /api/dates/bookings/[id]/route.ts` - Update booking
- [ ] Create `DELETE /api/dates/bookings/[id]/route.ts` - Cancel booking
- [ ] Create `POST /api/dates/checkin/route.ts` - QR check-in

### 2.4 B2B Domain - Tables

- [ ] Create `merchants` table
  - `id` UUID PK
  - `name` VARCHAR(255)
  - `business_type` VARCHAR(50)
  - `description` TEXT
  - `contact_email` VARCHAR(255)
  - `contact_phone` VARCHAR(50)
  - `address` TEXT
  - `logo_url` TEXT
  - `status` VARCHAR(20) DEFAULT 'pending'
  - `tier` VARCHAR(20) DEFAULT 'basic'
  - `api_key` VARCHAR(255) UNIQUE
  - `metadata` JSONB
  - `created_at`, `updated_at` TIMESTAMP
- [ ] Create `merchant_users` table
  - `id` UUID PK
  - `merchant_id` UUID FK
  - `email` VARCHAR(255) UNIQUE
  - `password_hash` TEXT
  - `display_name` VARCHAR(100)
  - `role` VARCHAR(20) DEFAULT 'staff'
  - `permissions` JSONB
  - `is_active` BOOLEAN
  - `created_at`, `updated_at` TIMESTAMP
- [ ] Add FK to `date_venues.merchant_id`
- [ ] Add FK to `activities.sponsor_merchant_id`
- [ ] Add FK to `rewards.partner_id`
- [ ] Create Drizzle schema: `/src/lib/db/schema/b2b.ts`

### 2.5 B2B Campaigns & Quests - Tables

- [ ] Create `campaigns` table
  - `id` UUID PK
  - `merchant_id` UUID FK
  - `name` VARCHAR(255)
  - `type` VARCHAR(50)
  - `description` TEXT
  - `budget` DECIMAL(10,2)
  - `spent` DECIMAL(10,2) DEFAULT 0
  - `cpa_rate`, `cpmi_rate` DECIMAL(10,2)
  - `target_audience` JSONB
  - `start_date`, `end_date` TIMESTAMP
  - `status` VARCHAR(20) DEFAULT 'draft'
  - `metrics` JSONB
  - `created_at`, `updated_at` TIMESTAMP
- [ ] Create `branded_quests` table
  - `id` UUID PK
  - `campaign_id` UUID FK
  - `activity_id` UUID FK
  - `name` VARCHAR(255)
  - `description`, `instructions` TEXT
  - `coin_reward` INTEGER
  - `voucher_reward_id` UUID FK
  - `max_completions` INTEGER
  - `completion_count` INTEGER DEFAULT 0
  - `is_active` BOOLEAN
  - `created_at` TIMESTAMP
- [ ] Create `quest_completions` table
  - `id` UUID PK
  - `branded_quest_id` UUID FK
  - `user_id` UUID FK
  - `match_id` UUID FK
  - `completed_at` TIMESTAMP
  - `reward_granted` BOOLEAN
  - UNIQUE(branded_quest_id, user_id)

### 2.6 B2B Services

- [ ] Create `/src/lib/auth-b2b.ts` - B2B authentication
  - [ ] Separate session management
  - [ ] API key validation middleware
  - [ ] Role-based permissions
- [ ] Create `/src/lib/services/merchant.ts`
  - [ ] `createMerchant(data)` - Create merchant
  - [ ] `getMerchantById(merchantId)` - Get merchant
  - [ ] `updateMerchant(merchantId, data)` - Update merchant
  - [ ] `createMerchantUser(merchantId, data)` - Add user
  - [ ] `generateAPIKey(merchantId)` - Generate API key
- [ ] Create `/src/lib/services/campaign.ts`
  - [ ] `createCampaign(merchantId, data)` - Create campaign
  - [ ] `getCampaigns(merchantId, filters)` - List campaigns
  - [ ] `updateCampaignStatus(campaignId, status)` - Update status
- [ ] Create `/src/lib/services/quest.ts`
  - [ ] `createBrandedQuest(campaignId, data)` - Create quest
  - [ ] `trackQuestCompletion(questId, userId, matchId)` - Track completion

### 2.7 B2B API Routes (MVP)

- [ ] Create `POST /api/b2b/auth/login/route.ts` - Merchant login
- [ ] Create `POST /api/b2b/auth/logout/route.ts` - Merchant logout
- [ ] Create `GET /api/b2b/auth/session/route.ts` - Check session
- [ ] Create `GET /api/b2b/merchant/route.ts` - Get merchant profile
- [ ] Create `PUT /api/b2b/merchant/route.ts` - Update merchant
- [ ] Create `GET /api/b2b/campaigns/route.ts` - List campaigns
- [ ] Create `POST /api/b2b/campaigns/route.ts` - Create campaign
- [ ] Create `GET /api/b2b/campaigns/[id]/route.ts` - Campaign details
- [ ] Create `PUT /api/b2b/campaigns/[id]/route.ts` - Update campaign
- [ ] Create `GET /api/b2b/quests/route.ts` - List quests
- [ ] Create `POST /api/b2b/quests/route.ts` - Create quest
- [ ] Create `GET /api/b2b/venues/route.ts` - List merchant venues
- [ ] Create `POST /api/b2b/venues/route.ts` - Add venue

### 2.8 Voice Notes

- [ ] Configure Vercel Blob for audio storage
- [ ] Create upload/download utilities
- [ ] Create `POST /api/users/voice-note/route.ts` - Upload
- [ ] Create `DELETE /api/users/voice-note/route.ts` - Remove
- [ ] Create `/src/components/profile/VoiceRecorder.tsx`
- [ ] Add voice recorder to profile page

### 2.9 Frontend Updates - Phase 2

#### Paradise Mode Components

- [ ] Create `/src/components/paradise/VenueSearch.tsx`
- [ ] Create `/src/components/paradise/VenueCard.tsx`
- [ ] Create `/src/components/paradise/VenueDetail.tsx`
- [ ] Create `/src/components/paradise/BookingForm.tsx`
- [ ] Create `/src/components/paradise/BookingConfirmation.tsx`
- [ ] Create `/src/components/paradise/QRScanner.tsx`
- [ ] Create `/src/components/paradise/index.ts`

#### B2C Pages

- [ ] Create `/src/app/(authenticated)/dates/page.tsx` - Paradise Mode
- [ ] Create `/src/app/(authenticated)/dates/venues/[id]/page.tsx`
- [ ] Create `/src/app/(authenticated)/dates/bookings/page.tsx`

#### B2B Components

- [ ] Create `/src/components/b2b/DashboardOverview.tsx`
- [ ] Create `/src/components/b2b/MetricCard.tsx`
- [ ] Create `/src/components/b2b/CampaignList.tsx`
- [ ] Create `/src/components/b2b/CampaignCard.tsx`
- [ ] Create `/src/components/b2b/index.ts`

#### B2B Pages

- [ ] Create `/src/app/(b2b)/layout.tsx` - B2B layout
- [ ] Create `/src/app/(b2b)/login/page.tsx` - Merchant login
- [ ] Create `/src/app/(b2b)/dashboard/page.tsx` - Dashboard
- [ ] Create `/src/app/(b2b)/campaigns/page.tsx` - Campaigns list
- [ ] Create `/src/app/(b2b)/venues/page.tsx` - Venues management

---

## Phase 3: Full B2B + Advanced Features (8-10 สัปดาห์)

### 3.1 Analytics Domain - Tables

- [ ] Create `user_behavioral_profiles` table
- [ ] Create `aggregated_insights` table
- [ ] Create `campaign_events` table
- [ ] Create `unlock_history` table
- [ ] Create Drizzle schema: `/src/lib/db/schema/analytics.ts`

### 3.2 Analytics Services

- [ ] Create `/src/lib/services/analytics.ts`
  - [ ] `getMerchantOverview(merchantId, period)`
  - [ ] `getCampaignPerformance(campaignId)`
  - [ ] `getConversionFunnel(campaignId)`
  - [ ] `getAudienceInsights(merchantId, filters)`
  - [ ] `generateReport(merchantId, config)`
- [ ] Create `/src/lib/services/behavioral.ts`
  - [ ] `analyzeUserBehavior(userId)`
  - [ ] `updateBehavioralProfile(userId)`
  - [ ] `getPersonaType(userId)`
- [ ] Create `/src/lib/services/tracking.ts`
  - [ ] `trackCampaignEvent(campaignId, event)`
  - [ ] `trackUserAction(userId, action)`

### 3.3 Full B2B API Routes

- [ ] Create `GET /api/b2b/analytics/overview/route.ts`
- [ ] Create `GET /api/b2b/analytics/conversions/route.ts`
- [ ] Create `GET /api/b2b/analytics/audience/route.ts`
- [ ] Create `GET /api/b2b/analytics/campaigns/[id]/route.ts`
- [ ] Create `POST /api/b2b/analytics/reports/route.ts`
- [ ] Create `GET /api/b2b/analytics/reports/[id]/route.ts`
- [ ] Create `GET /api/b2b/billing/invoices/route.ts`
- [ ] Create `GET /api/b2b/billing/usage/route.ts`
- [ ] Create `GET /api/b2b/bookings/route.ts`
- [ ] Create `PUT /api/b2b/bookings/[id]/route.ts`

### 3.4 Partner Exchange

- [ ] Create `/src/lib/services/exchange.ts`
  - [ ] `getExchangePartners()`
  - [ ] `calculateExchangeRate(partnerId, amount)`
  - [ ] `executeExchange(userId, partnerId, amount)`
- [ ] Create `POST /api/playcoin/exchange/route.ts`

### 3.5 Subscription System

- [ ] Configure Stripe products and prices
- [ ] Create `/src/lib/services/subscription.ts`
  - [ ] `getCurrentSubscription(userId)`
  - [ ] `upgradeTier(userId, tier)`
  - [ ] `cancelSubscription(userId)`
  - [ ] `handleWebhook(event)`
- [ ] Create `GET /api/subscription/route.ts`
- [ ] Create `POST /api/subscription/upgrade/route.ts`
- [ ] Create `POST /api/subscription/cancel/route.ts`
- [ ] Create `POST /api/webhooks/payment/route.ts`

### 3.6 Full B2B Portal UI

#### Components

- [ ] Create `/src/components/b2b/CampaignEditor.tsx`
- [ ] Create `/src/components/b2b/QuestBuilder.tsx`
- [ ] Create `/src/components/b2b/AnalyticsDashboard.tsx`
- [ ] Create `/src/components/b2b/ConversionFunnel.tsx`
- [ ] Create `/src/components/b2b/AudienceInsights.tsx`
- [ ] Create `/src/components/b2b/ReportBuilder.tsx`
- [ ] Create `/src/components/b2b/BillingOverview.tsx`
- [ ] Create `/src/components/b2b/InvoiceList.tsx`

#### Pages

- [ ] Create `/src/app/(b2b)/campaigns/[id]/page.tsx`
- [ ] Create `/src/app/(b2b)/campaigns/new/page.tsx`
- [ ] Create `/src/app/(b2b)/quests/page.tsx`
- [ ] Create `/src/app/(b2b)/quests/new/page.tsx`
- [ ] Create `/src/app/(b2b)/analytics/page.tsx`
- [ ] Create `/src/app/(b2b)/settings/page.tsx`
- [ ] Create `/src/app/(b2b)/billing/page.tsx`

### 3.7 Advanced Matching

- [ ] Update matching algorithm with behavioral personas
- [ ] Add location-based preferences
- [ ] Implement premium priority matching
- [ ] Create venue recommendation AI

### 3.8 Final Integration

- [ ] End-to-end testing for all user flows
- [ ] B2B workflow testing
- [ ] Payment flow testing
- [ ] Database query optimization
- [ ] API response time audit
- [ ] Frontend bundle optimization
- [ ] API documentation (OpenAPI/Swagger)
- [ ] B2B onboarding guide
- [ ] Internal developer documentation

---

## Verification Checklist

### Phase 0 Complete

- [x] Drizzle ORM working alongside raw SQL
- [x] All shadcn/ui components installed
- [x] Service layer pattern established
- [x] Feature flags system working

### Phase 1 Complete

- [ ] All existing v1 features unchanged
- [ ] PlayCoin wallet functional
- [ ] Daily check-in working with streak
- [ ] Chemistry meter on all matches
- [ ] Avatar builder functional
- [ ] Reward redemption working

### Phase 2 Complete

- [ ] Paradise Mode bookable
- [ ] QR check-in earning coins
- [ ] B2B login working
- [ ] Campaign CRUD operational
- [ ] Voice notes uploadable

### Phase 3 Complete

- [ ] Analytics dashboard showing metrics
- [ ] Subscription system processing payments
- [ ] Partner exchange functional
- [ ] All 60+ API endpoints deployed
- [ ] Documentation complete

---

## Out of Scope (Future Phases)

- [ ] Mobile App (React Native/Flutter)
- [ ] Advanced AI recommendations
- [ ] Real-time WebSocket (full implementation)
- [ ] Push notifications (native)
- [ ] Multi-language support
- [ ] Admin dashboard
