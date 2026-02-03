# SDD v2: System Design Document - PlayMyDate

> **Version:** 2.0
> **วันที่:** กุมภาพันธ์ 2026
> **สถานะ:** Draft
> **อ้างอิง:** SRD v2 - Unified Relationship Economy Platform

---

## 0. Changes from v1

ส่วนนี้อธิบายการเปลี่ยนแปลงและการพัฒนาจาก SDD v1 เพื่อให้เห็นภาพรวมของวิวัฒนาการของระบบ

### 0.1 Document Change Summary

| หัวข้อ | v1 | v2 | ผลกระทบ |
|--------|----|----|---------|
| **Architecture** | Microservices (7 services) | Next.js Monolith on Vercel | ลดความซับซ้อน, Serverless scaling |
| **Database** | PostgreSQL + Redis + Message Queue | PostgreSQL (Neon Serverless) + Vercel Blob | Simplified stack |
| **ขอบเขต** | B2C Dating App | B2C + B2B Unified Economy Platform | เพิ่ม B2B Portal |
| **Data Model** | 8 ตาราง | 25+ ตาราง | ขยาย domains ใหม่ |
| **API Endpoints** | ~18 endpoints | ~60+ endpoints | เพิ่ม B2B และ PlayCoin APIs |
| **Real-time** | WebSocket + Message Queue | Polling (WebSocket Phase 2) | ลดความซับซ้อนเริ่มต้น |
| **Revenue Model** | Subscription + Commission | Multi-layered (Subscription + PlayCoin + CPA/CPMI + Data) | ระบบ Billing ใหม่ |

### 0.2 Architecture Evolution

```
┌─────────────────────────────────────────────────────────────────────┐
│                    v1 Architecture (Microservices)                   │
├─────────────────────────────────────────────────────────────────────┤
│  [Mobile App]                                                        │
│       │                                                              │
│       ↓                                                              │
│  [API Gateway] ─── Auth, Routing, Rate Limiting                      │
│       │                                                              │
│       ├── [User Service]                                             │
│       ├── [Matching Service]                                         │
│       ├── [Activity Service]                                         │
│       ├── [Communication Service]                                    │
│       ├── [Intimacy Service]                                         │
│       ├── [Date Planning Service]                                    │
│       └── [Payment Service]                                          │
│              │                                                       │
│       ┌──────┴──────┐                                                │
│       ↓             ↓                                                │
│  [PostgreSQL]   [Redis]   [RabbitMQ/SQS]                            │
│  (8 tables)     (Cache)   (Async Tasks)                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                    Architecture Evolution
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    v2 Architecture (Next.js Monolith)                │
├─────────────────────────────────────────────────────────────────────┤
│  [Users / Merchants]                                                 │
│         │                                                            │
│         ↓                                                            │
│  [Vercel Edge Network] ─── CDN, SSL, Rate Limiting                   │
│         │                                                            │
│         ↓                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Next.js App (Serverless)                                       ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │  /app                                                      │  ││
│  │  │  ├── (b2c)/* ─── B2C Pages (Matches, Chat, Wallet, etc.)  │  ││
│  │  │  ├── (b2b)/* ─── B2B Portal (Dashboard, Campaigns, etc.)  │  ││
│  │  │  └── /api/* ─── API Routes (60+ Serverless Functions)     │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │  /lib/services/*                                           │  ││
│  │  │  └── Business Logic Modules (15 service modules)          │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
│         │                                                            │
│    ┌────┴────────────────┐                                          │
│    ↓                     ↓                                           │
│  [Neon PostgreSQL]  [Vercel Blob]                                   │
│  (25+ tables)       (Media Storage)                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 0.3 Service Consolidation

v1 มี 7 microservices แยกกัน ใน v2 รวมเป็น business logic modules ใน `/lib/services`:

| v1 Service | v2 Module(s) | หมายเหตุ |
|------------|--------------|----------|
| User Service | `/lib/services/user.ts` | คงไว้ |
| Matching Service | `/lib/services/matching.ts` | คงไว้ + Chemistry |
| Activity Service | `/lib/services/activity.ts` | + Branded Quests |
| Communication Service | `/lib/services/communication.ts` | คงไว้ |
| Intimacy Service | `/lib/services/intimacy.ts` | คงไว้ |
| Date Planning Service | `/lib/services/venue.ts`, `booking.ts` | แยกเป็น 2 modules |
| Payment Service | `/lib/services/payment.ts` | + PlayCoin |
| **NEW** | `/lib/services/playcoin.ts`, `reward.ts`, `checkin.ts` | PlayCoin ecosystem |
| **NEW** | `/lib/services/merchant.ts`, `campaign.ts`, `quest.ts`, `analytics.ts` | B2B platform |

### 0.4 Data Model Changes

**ตารางเดิม (Enhanced):**
- `users` - เพิ่ม avatar_config, voice_note_url, behavioral_persona, subscription fields, referral_code
- `matches` - เพิ่ม chemistry_score, mission_streak, paradise_mode_unlocked
- `activities` - เพิ่ม is_branded, sponsor_merchant_id, coin_reward, difficulty_level
- `activity_instances` - เพิ่ม coins_earned, expires_at
- `messages` - เพิ่ม message_type (icebreaker, system)
- `intimacy_scores` - เปลี่ยนเป็น score แทน factors

**ตารางใหม่:**

| Domain | Tables | จำนวน |
|--------|--------|-------|
| Date Planning | date_venues, date_bookings, qr_checkins | 3 |
| PlayCoin | playcoin_wallets, playcoin_transactions, daily_checkins, rewards, user_rewards | 5 |
| B2B | merchants, merchant_users, campaigns, branded_quests, quest_completions | 5 |
| Analytics | user_behavioral_profiles, aggregated_insights, campaign_events | 3 |
| **Total NEW** | | **16** |

### 0.5 API Changes

| v1 Domain | v1 Count | v2 Count | สถานะ |
|-----------|----------|----------|--------|
| `/api/auth/*` | 4 | 6 | +2 (password reset) |
| `/api/users/*` | 3 | 5 | +2 (avatar, voice) |
| `/api/matches/*` | 4 | 5 | +1 (chemistry) |
| `/api/messages/*` | 3 | 3 | คงไว้ |
| `/api/activities/*` | 4 | 5 | +1 (daily missions) |
| `/api/intimacy/*` | 3 | 3 | คงไว้ |
| `/api/subscriptions/*` | 4 | 3 | ลดรูป |
| `/api/dates/*` | 4 | 9 | **+5 (booking, QR)** |
| **NEW:** `/api/playcoin/*` | 0 | 7 | **+7** |
| **NEW:** `/api/b2b/*` | 0 | 25+ | **+25** |
| **Total** | ~18 | ~60+ | **+40+** |

### 0.6 Migration Considerations

**Breaking Changes:**
- Database schema มีการเปลี่ยนแปลงมาก ต้อง migrate data
- API endpoints บางตัวเปลี่ยน path/structure
- Authentication flow เปลี่ยนจาก JWT เป็น Session-based

**Migration Steps:**
1. Migrate existing users table to new schema
2. Create new tables (PlayCoin, B2B, etc.)
3. Initialize wallets for existing users
4. Update API endpoints gradually
5. Deploy new frontend with feature flags

---

## 1. Architecture Overview

ระบบ PlayMyDate v2 ใช้สถาปัตยกรรมแบบ **Next.js Monolith** บน **Vercel** แบ่งเป็น 3 ชั้นหลัก

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Vercel Platform                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      Edge Network                                ││
│  │  • Global CDN (300+ PoPs)                                       ││
│  │  • SSL Termination                                              ││
│  │  • DDoS Protection                                              ││
│  │  • Edge Middleware (Auth, Rate Limiting)                        ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Next.js Application                           ││
│  │  ┌───────────────────┬───────────────────┬───────────────────┐  ││
│  │  │  Static Pages     │ Server Components │  API Routes       │  ││
│  │  │  (Edge Cached)    │ (Streaming SSR)   │ (Serverless Fn)   │  ││
│  │  │                   │                   │                   │  ││
│  │  │  • Landing        │ • Match List      │ • /api/auth/*     │  ││
│  │  │  • Login/Register │ • Chat Room       │ • /api/users/*    │  ││
│  │  │  • Static Content │ • Dashboard       │ • /api/matches/*  │  ││
│  │  │                   │                   │ • /api/playcoin/* │  ││
│  │  │                   │                   │ • /api/b2b/*      │  ││
│  │  └───────────────────┴───────────────────┴───────────────────┘  ││
│  │                              │                                   ││
│  │                              ↓                                   ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │               /lib/services/* (Business Logic)             │  ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  ││
│  │  │  │  Core   │ │ Loyalty │ │   B2B   │ │    External     │  │  ││
│  │  │  │ Modules │ │ Modules │ │ Modules │ │    Services     │  │  ││
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│         ┌────────────────────┼────────────────────┐                 │
│         ↓                    ↓                    ↓                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐     │
│  │    Neon     │    │   Vercel    │    │  External Services  │     │
│  │ PostgreSQL  │    │    Blob     │    │  • Stripe           │     │
│  │ (Serverless)│    │  (Storage)  │    │  • Resend           │     │
│  │             │    │             │    │  • Daily.co (P2)    │     │
│  │  25+ Tables │    │  Images,    │    │  • Google Maps (P2) │     │
│  │             │    │  Voice Notes│    │                     │     │
│  └─────────────┘    └─────────────┘    └─────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Presentation Layer (`/app`)

**1.2.1 B2C Routes** (`/(b2c)/*`)

| Route Group | หน้า | หน้าที่ |
|-------------|------|---------|
| `/(auth)` | `/login`, `/register`, `/forgot-password` | Authentication flows |
| `/(main)` | `/matches`, `/chat/[id]`, `/activities` | Core dating features |
| `/(wallet)` | `/wallet`, `/rewards`, `/transactions` | PlayCoin management |
| `/(paradise)` | `/dates`, `/venues`, `/bookings` | Date planning |
| `/(settings)` | `/profile`, `/settings`, `/subscription` | User settings |

**1.2.2 B2B Routes** (`/(b2b)/*`)

| Route Group | หน้า | หน้าที่ |
|-------------|------|---------|
| `/(auth)` | `/b2b/login` | Merchant authentication |
| `/(dashboard)` | `/b2b/dashboard` | Overview & Quick Actions |
| `/(campaigns)` | `/b2b/campaigns/*` | Campaign management |
| `/(quests)` | `/b2b/quests/*` | Branded quest builder |
| `/(venues)` | `/b2b/venues/*` | Venue management |
| `/(analytics)` | `/b2b/analytics/*` | Reports & Insights |
| `/(settings)` | `/b2b/settings/*` | Account & Billing |

**1.2.3 Shared Components** (`/components`)

```
/components
├── /ui              # shadcn/ui primitives (DO NOT MODIFY)
├── /auth            # Auth-related components
├── /chat            # Chat UI components
├── /activity        # Game/Activity components
├── /wallet          # PlayCoin wallet components
├── /booking         # Date booking components
├── /b2b             # B2B portal components
└── /shared          # Shared utilities
```

### 1.3 API Layer (`/app/api`)

**API Route Structure:**

```
/app/api
├── /auth
│   ├── /register/route.ts
│   ├── /login/route.ts
│   ├── /logout/route.ts
│   ├── /session/route.ts
│   ├── /forgot-password/route.ts
│   └── /reset-password/route.ts
├── /users
│   ├── /me/route.ts
│   ├── /[id]/route.ts
│   ├── /avatar/route.ts
│   └── /voice-note/route.ts
├── /matches
│   ├── /route.ts
│   ├── /find/route.ts
│   ├── /[id]/route.ts
│   ├── /[id]/chemistry/route.ts
│   └── /unmatch/route.ts
├── /messages
│   ├── /route.ts
│   └── /typing/route.ts
├── /activities
│   ├── /route.ts
│   ├── /daily-missions/route.ts
│   ├── /start/route.ts
│   ├── /complete/route.ts
│   └── /instances/route.ts
├── /intimacy
│   ├── /route.ts
│   ├── /unlock/route.ts
│   └── /request-reveal/route.ts
├── /playcoin               # NEW
│   ├── /wallet/route.ts
│   ├── /transactions/route.ts
│   ├── /checkin/route.ts
│   ├── /rewards/route.ts
│   ├── /redeem/route.ts
│   ├── /user-rewards/route.ts
│   └── /exchange/route.ts
├── /dates                  # NEW/Enhanced
│   ├── /venues/route.ts
│   ├── /venues/[id]/route.ts
│   ├── /recommendations/route.ts
│   ├── /bookings/route.ts
│   ├── /bookings/[id]/route.ts
│   └── /checkin/route.ts
├── /subscription
│   ├── /route.ts
│   ├── /upgrade/route.ts
│   └── /cancel/route.ts
├── /b2b                    # NEW
│   ├── /auth/*
│   ├── /merchant/*
│   ├── /campaigns/*
│   ├── /quests/*
│   ├── /venues/*
│   ├── /bookings/*
│   ├── /analytics/*
│   └── /billing/*
└── /webhooks
    ├── /payment/route.ts
    └── /partner/[partnerId]/route.ts
```

### 1.4 Data Layer

**1.4.1 PostgreSQL via Neon**

- **Connection:** Neon Serverless Driver (`@neondatabase/serverless`)
- **Connection Pooling:** Built-in serverless connection pooling
- **Tables:** 25+ tables across 6 domains

**1.4.2 Vercel Blob**

- **Purpose:** Media file storage (images, voice notes)
- **Access:** Direct URL access with CDN caching
- **Security:** Signed URLs for private content

### 1.5 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16+ | Full-stack Web Framework (App Router) |
| **Runtime** | Node.js | 20 LTS | Server Runtime |
| **UI Library** | React | 19+ | UI Components |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **UI Components** | shadcn/ui | latest | Accessible UI Primitives |
| **Auth** | Lucia | v3 | Session-based Authentication |
| **Password Hashing** | Argon2id | - | Secure Password Hashing |
| **Database** | PostgreSQL | 16+ | Primary Data Store |
| **DB Provider** | Neon | Serverless | Serverless PostgreSQL |
| **ORM/Query** | Drizzle ORM | latest | Type-safe SQL Queries |
| **Storage** | Vercel Blob | - | Media File Storage |
| **Payment** | Stripe | - | Payment Processing |
| **Email** | Resend | - | Transactional Email |
| **Hosting** | Vercel | - | Serverless Deployment |

---

## 2. Component Responsibilities

### 2.1 B2C Frontend Modules

#### 2.1.1 Auth Module

**หน้าที่หลัก:**
- การลงทะเบียนผู้ใช้ใหม่
- การเข้าสู่ระบบ (Email/Password)
- การรีเซ็ตรหัสผ่าน
- Session management

**Components:**
- `LoginForm` - ฟอร์มเข้าสู่ระบบ
- `RegisterForm` - ฟอร์มลงทะเบียน
- `ForgotPasswordForm` - ฟอร์มขอรีเซ็ตรหัสผ่าน
- `ResetPasswordForm` - ฟอร์มตั้งรหัสผ่านใหม่

#### 2.1.2 Profile Module

**หน้าที่หลัก:**
- จัดการข้อมูลโปรไฟล์
- สร้างและแก้ไข AI Avatar
- บันทึก Voice Note
- แก้ไข Preferences

**Components:**
- `ProfileEditor` - แก้ไขข้อมูลโปรไฟล์
- `AvatarBuilder` - สร้าง/แก้ไข Avatar
- `VoiceRecorder` - บันทึก Voice Note
- `PreferencesForm` - ตั้งค่า Preferences

#### 2.1.3 Matching Module

**หน้าที่หลัก:**
- แสดงรายการ Match
- ค้นหา Match ใหม่
- แสดงรายละเอียด Match
- จัดการ Match (Unmatch, Block)

**Components:**
- `MatchList` - รายการ Matches
- `MatchCard` - การ์ดแสดง Match
- `MatchDetail` - รายละเอียด Match
- `ChemistryMeter` - แสดงคะแนน Chemistry
- `CompatibilityBreakdown` - วิเคราะห์ความเข้ากัน

#### 2.1.4 Activity Module

**หน้าที่หลัก:**
- แสดง Daily Missions
- เล่นเกม Co-op
- ติดตามความคืบหน้า
- รับรางวัล

**Components:**
- `DailyMissionList` - รายการภารกิจรายวัน
- `MissionCard` - การ์ดภารกิจ
- `GamePlayer` - เล่นเกม
- `GameResult` - ผลลัพธ์เกม
- `QuestProgress` - ความคืบหน้า

#### 2.1.5 Chat Module

**หน้าที่หลัก:**
- ส่งและรับข้อความ
- แสดงสถานะ Typing
- Voice/Video Call (Post-unlock)
- Auto-Icebreaker

**Components:**
- `ChatRoom` - ห้องแชท
- `MessageList` - รายการข้อความ
- `MessageInput` - พิมพ์ข้อความ
- `TypingIndicator` - แสดง "กำลังพิมพ์..."
- `CallInterface` - Voice/Video Call UI
- `IcebreakerPrompt` - ตัวช่วยเริ่มบทสนทนา

#### 2.1.6 Paradise Module (Date Planning)

**หน้าที่หลัก:**
- ค้นหาสถานที่เดท
- จองร้านอาหาร/คาเฟ่
- จัดการ Split Bill
- QR Check-in

**Components:**
- `VenueSearch` - ค้นหาสถานที่
- `VenueCard` - การ์ดสถานที่
- `VenueDetail` - รายละเอียดสถานที่
- `BookingForm` - ฟอร์มจอง
- `BookingConfirmation` - ยืนยันการจอง
- `SplitBillManager` - จัดการแบ่งค่าใช้จ่าย
- `QRScanner` - สแกน QR Check-in

#### 2.1.7 Wallet Module (PlayCoin)

**หน้าที่หลัก:**
- แสดงยอด PlayCoin
- ประวัติ Transaction
- Daily Check-in
- แลก Rewards

**Components:**
- `WalletBalance` - แสดงยอดคงเหลือ
- `TransactionHistory` - ประวัติธุรกรรม
- `DailyCheckin` - ปุ่ม Check-in
- `StreakIndicator` - แสดง Streak
- `RewardCatalog` - รายการ Rewards
- `RewardCard` - การ์ด Reward
- `RedeemConfirmation` - ยืนยันการแลก

#### 2.1.8 Settings Module

**หน้าที่หลัก:**
- ตั้งค่า Notifications
- จัดการ Subscription
- Privacy Settings
- Account Management

**Components:**
- `NotificationSettings` - ตั้งค่าแจ้งเตือน
- `SubscriptionManager` - จัดการสมาชิก
- `PrivacySettings` - ตั้งค่าความเป็นส่วนตัว
- `AccountSettings` - จัดการบัญชี
- `DeleteAccountModal` - ลบบัญชี

### 2.2 B2B Portal Modules

#### 2.2.1 B2B Auth Module

**หน้าที่หลัก:**
- Merchant Login/Logout
- Multi-factor Authentication (Optional)
- API Key Management

**Components:**
- `MerchantLoginForm` - ฟอร์มเข้าสู่ระบบ
- `MFASetup` - ตั้งค่า MFA
- `APIKeyManager` - จัดการ API Keys

#### 2.2.2 Dashboard Module

**หน้าที่หลัก:**
- Overview ของ Business Performance
- Quick Actions
- Recent Activity

**Components:**
- `DashboardOverview` - ภาพรวม
- `MetricCard` - การ์ดแสดง Metric
- `QuickActions` - ปุ่มทางลัด
- `RecentActivity` - กิจกรรมล่าสุด

#### 2.2.3 Campaign Module

**หน้าที่หลัก:**
- สร้าง/แก้ไข Campaign
- จัดการ Budget
- Schedule Campaigns
- Monitor Performance

**Components:**
- `CampaignList` - รายการ Campaigns
- `CampaignEditor` - สร้าง/แก้ไข Campaign
- `BudgetManager` - จัดการงบประมาณ
- `CampaignScheduler` - กำหนดเวลา
- `CampaignMetrics` - ผลลัพธ์ Campaign

#### 2.2.4 Quest Module

**หน้าที่หลัก:**
- สร้าง Branded Quests
- เลือก Game Template
- กำหนด Rewards
- ติดตาม Completions

**Components:**
- `QuestBuilder` - สร้าง Quest
- `TemplateSelector` - เลือก Template
- `RewardConfigurator` - กำหนดรางวัล
- `QuestPreview` - Preview Quest
- `CompletionTracker` - ติดตามผล

#### 2.2.5 Venue Module

**หน้าที่หลัก:**
- จัดการสถานที่
- ตั้งค่า Availability
- จัดการ Pricing
- QR Code Generation

**Components:**
- `VenueManager` - จัดการสถานที่
- `VenueForm` - ฟอร์มสถานที่
- `AvailabilityCalendar` - ปฏิทิน Availability
- `PricingManager` - จัดการราคา
- `QRGenerator` - สร้าง QR Code

#### 2.2.6 Booking Module

**หน้าที่หลัก:**
- รับ Bookings
- Confirm/Reject
- Track Arrivals
- No-show Management

**Components:**
- `BookingList` - รายการ Bookings
- `BookingDetail` - รายละเอียด Booking
- `BookingCalendar` - ปฏิทินการจอง
- `CheckinManager` - จัดการ Check-in

#### 2.2.7 Analytics Module

**หน้าที่หลัก:**
- Performance Metrics
- Conversion Funnels
- Audience Insights
- Custom Reports

**Components:**
- `AnalyticsDashboard` - Dashboard วิเคราะห์
- `ConversionFunnel` - แสดง Funnel
- `AudienceInsights` - ข้อมูลกลุ่มเป้าหมาย
- `ReportBuilder` - สร้างรายงาน
- `ReportExporter` - Export รายงาน

#### 2.2.8 B2B Settings Module

**หน้าที่หลัก:**
- Profile Management
- User Management
- Billing & Invoices
- API Configuration

**Components:**
- `MerchantProfileForm` - แก้ไขข้อมูล Merchant
- `UserManager` - จัดการ Users
- `BillingOverview` - ภาพรวม Billing
- `InvoiceList` - รายการ Invoices
- `APIConfiguration` - ตั้งค่า API

### 2.3 Service Modules (`/lib/services`)

#### 2.3.1 Core Modules

| Module | File | ความรับผิดชอบ |
|--------|------|---------------|
| **Auth** | `/lib/auth.ts` | Session management, Password hashing, Login/Logout |
| **User** | `/lib/services/user.ts` | User CRUD, Profile management, Avatar, Voice notes |
| **Matching** | `/lib/services/matching.ts` | Match algorithm, Compatibility calculation, Chemistry tracking |
| **Activity** | `/lib/services/activity.ts` | Games, Missions, Progress tracking, Results |
| **Communication** | `/lib/services/communication.ts` | Messages, Typing status |
| **Intimacy** | `/lib/services/intimacy.ts` | Chemistry meter, Unlocks, Request reveal |

#### 2.3.2 Loyalty Modules (NEW)

| Module | File | ความรับผิดชอบ |
|--------|------|---------------|
| **PlayCoin** | `/lib/services/playcoin.ts` | Wallet operations, Transactions, Balance management |
| **Reward** | `/lib/services/reward.ts` | Reward catalog, Redemption, Partner exchange |
| **Checkin** | `/lib/services/checkin.ts` | Daily check-in, Streaks, QR check-in |

#### 2.3.3 B2B Modules (NEW)

| Module | File | ความรับผิดชอบ |
|--------|------|---------------|
| **Merchant** | `/lib/services/merchant.ts` | Merchant accounts, Users, API keys |
| **Campaign** | `/lib/services/campaign.ts` | Campaign CRUD, Budget, Scheduling |
| **Quest** | `/lib/services/quest.ts` | Branded quests, Templates, Completions |
| **Venue** | `/lib/services/venue.ts` | Venue management, Availability |
| **Booking** | `/lib/services/booking.ts` | Reservations, Confirmations |
| **Analytics** | `/lib/services/analytics.ts` | Metrics, Reports, Insights |

### 2.4 External Services Integration

#### 2.4.1 Payment (Stripe)

**หน้าที่:**
- Subscription billing
- PlayCoin purchases
- B2B invoicing

**Integration Points:**
- `/api/subscription/upgrade` - Create subscription
- `/api/playcoin/purchase` - One-time purchase
- `/api/webhooks/payment` - Webhook handler

#### 2.4.2 Email (Resend)

**หน้าที่:**
- Password reset emails
- Booking confirmations
- Match notifications
- B2B invoices

**Integration Points:**
- `/lib/services/email.ts` - Email service module

#### 2.4.3 Media Storage (Vercel Blob)

**หน้าที่:**
- Profile images
- Voice notes
- Venue photos
- Campaign assets

**Integration Points:**
- `/api/users/avatar` - Upload avatar
- `/api/users/voice-note` - Upload voice note
- `/api/b2b/venues` - Upload venue photos

#### 2.4.4 Future Services (Phase 2)

| Service | Provider | Purpose |
|---------|----------|---------|
| Maps API | Google Maps | Venue search, Location |
| Video Call | Daily.co | Voice/Video calls |
| Push Notifications | Web Push API | Real-time notifications |
| Partner APIs | The 1, Blue Card | Point exchange |

---

## 3. API / Interface Design

### 3.1 API Design Principles

- **RESTful Design:** Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON Response:** ทุก response เป็น JSON format
- **Authentication:** Session-based via Lucia
- **Rate Limiting:** Edge middleware rate limiting
- **Error Handling:** Consistent error response format

**Standard Response Format:**

```typescript
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### 3.2 B2C API Endpoints

#### 3.2.1 Authentication (`/api/auth/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | ลงทะเบียนผู้ใช้ใหม่ | No |
| POST | `/api/auth/login` | เข้าสู่ระบบ | No |
| POST | `/api/auth/logout` | ออกจากระบบ | Yes |
| GET | `/api/auth/session` | ตรวจสอบ Session | No |
| POST | `/api/auth/forgot-password` | ขอรีเซ็ตรหัสผ่าน | No |
| POST | `/api/auth/reset-password` | รีเซ็ตรหัสผ่าน | No |

**POST /api/auth/register**

```typescript
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John",
  "playingStyle": ["cooperative", "explorer"],
  "interests": ["movies", "food", "travel"]
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "John"
    }
  }
}
```

**POST /api/auth/login**

```typescript
// Request
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "John",
      "subscriptionTier": "free"
    }
  }
}
```

#### 3.2.2 Users & Profile (`/api/users/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | ดูโปรไฟล์ตัวเอง | Yes |
| PUT | `/api/users/me` | แก้ไขโปรไฟล์ | Yes |
| POST | `/api/users/avatar` | บันทึก Avatar Config | Yes |
| POST | `/api/users/voice-note` | อัพโหลด Voice Note | Yes |
| GET | `/api/users/[id]` | ดูโปรไฟล์ผู้อื่น (ตาม Unlock Level) | Yes |

**GET /api/users/me**

```typescript
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John",
    "bio": "Love exploring new places",
    "playingStyle": ["cooperative", "explorer"],
    "interests": ["movies", "food", "travel"],
    "avatarConfig": { /* avatar settings */ },
    "voiceNoteUrl": "https://blob.vercel-storage.com/...",
    "behavioralPersona": "explorer",
    "subscriptionTier": "premium",
    "subscriptionExpiresAt": "2026-03-01T00:00:00Z",
    "referralCode": "JOHN123",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**POST /api/users/avatar**

```typescript
// Request
{
  "avatarConfig": {
    "style": "cartoon",
    "hairStyle": "short",
    "hairColor": "#333333",
    "skinTone": "#F5D0C0",
    "outfit": "casual",
    "accessories": ["glasses"]
  }
}

// Response
{
  "success": true,
  "data": {
    "avatarConfig": { /* saved config */ }
  }
}
```

#### 3.2.3 Matching (`/api/matches/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/matches` | รายการ Match ทั้งหมด | Yes |
| POST | `/api/matches/find` | ค้นหา Match ใหม่ | Yes |
| GET | `/api/matches/[id]` | ดูรายละเอียด Match | Yes |
| GET | `/api/matches/[id]/chemistry` | ดู Chemistry Meter | Yes |
| POST | `/api/matches/unmatch` | ยกเลิก Match | Yes |

**GET /api/matches**

```typescript
// Response
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match-uuid",
        "partner": {
          "id": "user-uuid",
          "displayName": "Jane",
          "avatarConfig": { /* avatar */ },
          "playingStyle": ["competitive", "achiever"]
        },
        "compatibilityScore": 75,
        "chemistryScore": 45,
        "missionStreak": 3,
        "paradiseModeUnlocked": false,
        "lastActivityAt": "2026-02-03T10:00:00Z",
        "createdAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

**POST /api/matches/find**

```typescript
// Request (optional filters)
{
  "ageRange": { "min": 25, "max": 35 },
  "location": "Bangkok"
}

// Response
{
  "success": true,
  "data": {
    "match": {
      "id": "match-uuid",
      "partner": { /* partner info */ },
      "compatibilityScore": 72,
      "compatibilityBreakdown": {
        "playingStyle": 35,
        "interests": 37
      }
    }
  }
}
```

#### 3.2.4 Messages (`/api/messages/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/messages?matchId=X` | ดูข้อความในห้องแชท | Yes |
| POST | `/api/messages` | ส่งข้อความ | Yes |
| POST | `/api/typing` | ส่งสถานะ Typing | Yes |

**GET /api/messages**

```typescript
// Query: ?matchId=match-uuid&cursor=message-uuid&limit=50

// Response
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-uuid",
        "senderId": "user-uuid",
        "content": "Hello!",
        "messageType": "text",
        "isRead": true,
        "readAt": "2026-02-03T10:05:00Z",
        "createdAt": "2026-02-03T10:00:00Z"
      }
    ],
    "nextCursor": "msg-uuid-next"
  }
}
```

**POST /api/messages**

```typescript
// Request
{
  "matchId": "match-uuid",
  "content": "Hello! How are you?",
  "messageType": "text"
}

// Response
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-uuid",
      "content": "Hello! How are you?",
      "messageType": "text",
      "createdAt": "2026-02-03T10:00:00Z"
    }
  }
}
```

#### 3.2.5 Activities & Missions (`/api/activities/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/activities` | รายการกิจกรรมที่เปิดใช้งาน | Yes |
| GET | `/api/activities/daily-missions?matchId=X` | Daily Missions สำหรับคู่ Match | Yes |
| POST | `/api/activities/start` | เริ่มกิจกรรม | Yes |
| POST | `/api/activities/complete` | จบกิจกรรม | Yes |
| GET | `/api/activities/instances?matchId=X` | ประวัติกิจกรรมของคู่ | Yes |

**GET /api/activities/daily-missions**

```typescript
// Query: ?matchId=match-uuid

// Response
{
  "success": true,
  "data": {
    "missions": [
      {
        "id": "activity-uuid",
        "name": "The Blind Taste",
        "type": "creative",
        "description": "ถ่ายรูปอาหารมื้อนี้แล้วให้อีกฝ่ายทาย",
        "difficultyLevel": 2,
        "intimacyPoints": 15,
        "coinReward": 25,
        "estimatedDurationMinutes": 10,
        "expiresAt": "2026-02-04T23:59:59Z"
      }
    ],
    "streak": 3,
    "nextStreakBonus": 4
  }
}
```

**POST /api/activities/complete**

```typescript
// Request
{
  "instanceId": "instance-uuid",
  "result": {
    "score": 80,
    "answers": ["correct", "incorrect", "correct"]
  }
}

// Response
{
  "success": true,
  "data": {
    "instance": {
      "id": "instance-uuid",
      "status": "completed",
      "result": { /* result data */ },
      "coinsEarned": 25,
      "intimacyPointsEarned": 15,
      "completedAt": "2026-02-03T10:30:00Z"
    },
    "newChemistryScore": 60,
    "newUnlocks": ["occupation"]
  }
}
```

#### 3.2.6 Intimacy & Unlocks (`/api/intimacy/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/intimacy?matchId=X` | ดูคะแนน Intimacy และ Available Unlocks | Yes |
| POST | `/api/intimacy/unlock` | ปลดล็อกข้อมูล | Yes |
| POST | `/api/intimacy/request-reveal` | ขอเปิดเผยข้อมูลก่อนถึง Threshold | Yes |

**GET /api/intimacy**

```typescript
// Query: ?matchId=match-uuid

// Response
{
  "success": true,
  "data": {
    "chemistryScore": 65,
    "unlocks": ["real_name", "photo"],
    "availableUnlocks": ["occupation"],
    "pendingRequests": [
      {
        "type": "voice_call",
        "requestedBy": "partner-uuid",
        "requestedAt": "2026-02-03T10:00:00Z"
      }
    ],
    "thresholds": {
      "real_name": 25,
      "photo": 45,
      "occupation": 65,
      "voice_call": 85,
      "video_call": 85,
      "paradise_mode": 100
    }
  }
}
```

#### 3.2.7 PlayCoin (`/api/playcoin/*`) - NEW

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/playcoin/wallet` | ดูยอด Wallet | Yes |
| GET | `/api/playcoin/transactions` | ประวัติ Transaction | Yes |
| POST | `/api/playcoin/checkin` | Daily Check-in | Yes |
| GET | `/api/playcoin/rewards` | Reward Catalog | Yes |
| POST | `/api/playcoin/redeem` | แลก Reward | Yes |
| GET | `/api/playcoin/user-rewards` | รายการ Reward ที่แลกไว้ | Yes |
| POST | `/api/playcoin/exchange` | แลกเป็น Partner Points | Yes |

**GET /api/playcoin/wallet**

```typescript
// Response
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 1250,
      "lifetimeEarned": 5000,
      "lifetimeSpent": 3750
    },
    "todayCheckin": {
      "completed": true,
      "streak": 5,
      "coinsEarned": 18
    }
  }
}
```

**POST /api/playcoin/checkin**

```typescript
// Response
{
  "success": true,
  "data": {
    "checkin": {
      "date": "2026-02-04",
      "streakCount": 6,
      "coinsEarned": 20,
      "nextStreakBonus": 24 // day 7 bonus
    },
    "newBalance": 1270
  }
}
```

**POST /api/playcoin/redeem**

```typescript
// Request
{
  "rewardId": "reward-uuid"
}

// Response
{
  "success": true,
  "data": {
    "userReward": {
      "id": "user-reward-uuid",
      "rewardId": "reward-uuid",
      "status": "redeemed",
      "redeemedAt": "2026-02-04T10:00:00Z",
      "expiresAt": "2026-03-04T10:00:00Z"
    },
    "newBalance": 750,
    "transactionId": "tx-uuid"
  }
}
```

#### 3.2.8 Date Planning (`/api/dates/*`) - NEW/Enhanced

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dates/venues` | ค้นหาสถานที่เดท | Yes |
| GET | `/api/dates/venues/[id]` | รายละเอียดสถานที่ | Yes |
| GET | `/api/dates/recommendations?matchId=X` | แนะนำสถานที่สำหรับคู่ | Yes |
| POST | `/api/dates/bookings` | จองสถานที่ | Yes |
| GET | `/api/dates/bookings` | รายการจองของฉัน | Yes |
| GET | `/api/dates/bookings/[id]` | รายละเอียดการจอง | Yes |
| PUT | `/api/dates/bookings/[id]` | แก้ไขการจอง | Yes |
| DELETE | `/api/dates/bookings/[id]` | ยกเลิกการจอง | Yes |
| POST | `/api/dates/checkin` | QR Check-in ที่ร้าน | Yes |

**GET /api/dates/venues**

```typescript
// Query: ?location=Bangkok&type=restaurant&priceRange=2,3&page=1

// Response
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "venue-uuid",
        "name": "Romantic Café",
        "venueType": "cafe",
        "address": "123 Sukhumvit Rd, Bangkok",
        "locationLat": 13.7563,
        "locationLng": 100.5018,
        "priceRange": 2,
        "cuisineType": "international",
        "ambianceTags": ["romantic", "cozy"],
        "rating": 4.5,
        "photos": ["url1", "url2"],
        "bookingEnabled": true
      }
    ],
    "pagination": {
      "page": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

**POST /api/dates/bookings**

```typescript
// Request
{
  "matchId": "match-uuid",
  "venueId": "venue-uuid",
  "bookingDate": "2026-02-14",
  "bookingTime": "19:00",
  "partySize": 2,
  "specialRequests": "Window seat please",
  "splitBillPreference": "equal",
  "voucherId": "voucher-uuid" // optional
}

// Response
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking-uuid",
      "status": "pending",
      "confirmationCode": "PMD-20260214-ABCD",
      "bookingDate": "2026-02-14",
      "bookingTime": "19:00",
      "venue": { /* venue info */ },
      "voucherApplied": { /* voucher info */ }
    }
  }
}
```

**POST /api/dates/checkin**

```typescript
// Request
{
  "qrCode": "PMD-QR-VENUE123-20260204",
  "bookingId": "booking-uuid" // optional
}

// Response
{
  "success": true,
  "data": {
    "checkin": {
      "id": "checkin-uuid",
      "venue": { /* venue info */ },
      "coinsEarned": 100,
      "checkedInAt": "2026-02-14T19:05:00Z"
    },
    "newBalance": 1350
  }
}
```

#### 3.2.9 Subscription (`/api/subscription/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subscription` | ดูสถานะสมาชิก | Yes |
| POST | `/api/subscription/upgrade` | อัพเกรดสมาชิก | Yes |
| POST | `/api/subscription/cancel` | ยกเลิกสมาชิก | Yes |

**GET /api/subscription**

```typescript
// Response
{
  "success": true,
  "data": {
    "subscription": {
      "tier": "premium",
      "expiresAt": "2026-03-01T00:00:00Z",
      "autoRenew": true,
      "features": [
        "unlimited_matches",
        "read_receipts",
        "priority_matching",
        "extra_daily_missions"
      ]
    },
    "plans": [
      {
        "id": "premium",
        "name": "Premium",
        "price": 299,
        "period": "monthly",
        "features": ["unlimited_matches", "read_receipts"]
      },
      {
        "id": "premium_plus",
        "name": "Premium Plus",
        "price": 499,
        "period": "monthly",
        "features": ["all_premium", "priority_matching", "extra_missions"]
      }
    ]
  }
}
```

### 3.3 B2B API Endpoints (NEW)

#### 3.3.1 B2B Authentication (`/api/b2b/auth/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/b2b/auth/login` | Merchant Login | No |
| POST | `/api/b2b/auth/logout` | Merchant Logout | Yes (B2B) |
| GET | `/api/b2b/auth/session` | ตรวจสอบ Session | No |
| POST | `/api/b2b/auth/api-key` | สร้าง API Key ใหม่ | Yes (B2B) |

#### 3.3.2 Merchant Profile (`/api/b2b/merchant/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/merchant` | ดูข้อมูล Merchant | Yes (B2B) |
| PUT | `/api/b2b/merchant` | แก้ไขข้อมูล Merchant | Yes (B2B) |
| GET | `/api/b2b/merchant/users` | รายการ Users ของ Merchant | Yes (B2B) |
| POST | `/api/b2b/merchant/users` | เพิ่ม User | Yes (B2B) |
| PUT | `/api/b2b/merchant/users/[id]` | แก้ไข User | Yes (B2B) |
| DELETE | `/api/b2b/merchant/users/[id]` | ลบ User | Yes (B2B) |

#### 3.3.3 Campaigns (`/api/b2b/campaigns/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/campaigns` | รายการ Campaign | Yes (B2B) |
| POST | `/api/b2b/campaigns` | สร้าง Campaign | Yes (B2B) |
| GET | `/api/b2b/campaigns/[id]` | รายละเอียด Campaign | Yes (B2B) |
| PUT | `/api/b2b/campaigns/[id]` | แก้ไข Campaign | Yes (B2B) |
| DELETE | `/api/b2b/campaigns/[id]` | ลบ Campaign | Yes (B2B) |
| POST | `/api/b2b/campaigns/[id]/activate` | เปิดใช้งาน Campaign | Yes (B2B) |
| POST | `/api/b2b/campaigns/[id]/pause` | หยุด Campaign ชั่วคราว | Yes (B2B) |

**POST /api/b2b/campaigns**

```typescript
// Request
{
  "name": "Valentine's Day Special",
  "type": "branded_quest",
  "description": "Special quest for couples",
  "budget": 50000,
  "cpaRate": 50,
  "cpmiRate": 5,
  "targetAudience": {
    "ageRange": { "min": 25, "max": 40 },
    "interests": ["food", "romantic"],
    "behavioralPersona": ["caregiver", "explorer"]
  },
  "startDate": "2026-02-10T00:00:00Z",
  "endDate": "2026-02-20T23:59:59Z"
}

// Response
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign-uuid",
      "status": "draft",
      "estimatedReach": 15000,
      "createdAt": "2026-02-04T10:00:00Z"
    }
  }
}
```

#### 3.3.4 Branded Quests (`/api/b2b/quests/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/quests` | รายการ Branded Quests | Yes (B2B) |
| POST | `/api/b2b/quests` | สร้าง Quest | Yes (B2B) |
| GET | `/api/b2b/quests/[id]` | รายละเอียด Quest | Yes (B2B) |
| PUT | `/api/b2b/quests/[id]` | แก้ไข Quest | Yes (B2B) |
| DELETE | `/api/b2b/quests/[id]` | ลบ Quest | Yes (B2B) |
| GET | `/api/b2b/quests/[id]/completions` | รายการคนที่ทำ Quest สำเร็จ | Yes (B2B) |

#### 3.3.5 Venues (`/api/b2b/venues/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/venues` | รายการสถานที่ของ Merchant | Yes (B2B) |
| POST | `/api/b2b/venues` | เพิ่มสถานที่ | Yes (B2B) |
| GET | `/api/b2b/venues/[id]` | รายละเอียดสถานที่ | Yes (B2B) |
| PUT | `/api/b2b/venues/[id]` | แก้ไขสถานที่ | Yes (B2B) |
| DELETE | `/api/b2b/venues/[id]` | ลบสถานที่ | Yes (B2B) |
| PUT | `/api/b2b/venues/[id]/availability` | อัพเดท Availability | Yes (B2B) |

#### 3.3.6 Bookings (`/api/b2b/bookings/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/bookings` | รายการ Booking ที่เข้ามา | Yes (B2B) |
| GET | `/api/b2b/bookings/[id]` | รายละเอียด Booking | Yes (B2B) |
| PUT | `/api/b2b/bookings/[id]` | Confirm/Reject Booking | Yes (B2B) |
| POST | `/api/b2b/bookings/[id]/checkin` | Manual Check-in | Yes (B2B) |

#### 3.3.7 Analytics (`/api/b2b/analytics/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/analytics/overview` | Dashboard Overview | Yes (B2B) |
| GET | `/api/b2b/analytics/conversions` | Conversion Metrics | Yes (B2B) |
| GET | `/api/b2b/analytics/audience` | Audience Insights | Yes (B2B) |
| GET | `/api/b2b/analytics/campaigns/[id]` | Campaign Performance | Yes (B2B) |
| POST | `/api/b2b/analytics/reports` | Generate Custom Report | Yes (B2B) |
| GET | `/api/b2b/analytics/reports/[id]` | Download Report | Yes (B2B) |

**GET /api/b2b/analytics/overview**

```typescript
// Response
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-02-01",
      "end": "2026-02-04"
    },
    "metrics": {
      "totalImpressions": 50000,
      "totalClicks": 5000,
      "questCompletions": 500,
      "appointments": 50,
      "conversions": 30,
      "totalSpend": 2500,
      "roi": 4.5
    },
    "trends": {
      "impressions": [12000, 13000, 12500, 12500],
      "conversions": [5, 8, 10, 7]
    }
  }
}
```

#### 3.3.8 Billing (`/api/b2b/billing/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/b2b/billing/invoices` | รายการ Invoice | Yes (B2B) |
| GET | `/api/b2b/billing/invoices/[id]` | รายละเอียด Invoice | Yes (B2B) |
| GET | `/api/b2b/billing/usage` | ดู Usage ปัจจุบัน | Yes (B2B) |

### 3.4 Webhook Integrations

| Endpoint | Trigger | Payload |
|----------|---------|---------|
| `POST /api/webhooks/payment` | Stripe Event | payment_id, event_type, amount |
| `POST /api/webhooks/partner/[partnerId]` | Partner Event | varies by partner |

**POST /api/webhooks/payment**

```typescript
// Stripe Webhook Payload (example: payment_intent.succeeded)
{
  "id": "evt_xxx",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 29900,
      "currency": "thb",
      "metadata": {
        "userId": "user-uuid",
        "type": "subscription",
        "tier": "premium"
      }
    }
  }
}

// Response
{
  "received": true
}
```

---

## 4. Data Model

### 4.1 Core User Data

#### Table: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,

  -- Playing Style & Interests
  playing_style VARCHAR(50)[] DEFAULT '{}',
  interests VARCHAR(100)[] DEFAULT '{}',

  -- Avatar & Voice (NEW in v2)
  avatar_config JSONB,
  voice_note_url TEXT,

  -- Private Data (Unlockable)
  real_name VARCHAR(100),
  photo_url TEXT,
  occupation VARCHAR(100),
  phone VARCHAR(20),

  -- Behavioral Data (NEW in v2)
  behavioral_persona VARCHAR(50),

  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,

  -- Referral (NEW in v2)
  referral_code VARCHAR(50) UNIQUE,
  referred_by_user_id UUID REFERENCES users(id),

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_playing_style ON users USING GIN(playing_style);
CREATE INDEX idx_users_interests ON users USING GIN(interests);
```

### 4.2 Matching & Relationship Data

#### Table: matches

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Scores
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  chemistry_score INTEGER DEFAULT 0 CHECK (chemistry_score >= 0 AND chemistry_score <= 100),

  -- Mission Tracking (NEW in v2)
  mission_streak INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),

  -- Paradise Mode (NEW in v2)
  paradise_mode_unlocked BOOLEAN DEFAULT false,
  paradise_mode_unlocked_at TIMESTAMP,

  -- Activity Tracking
  last_activity_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);
```

### 4.3 Activity & Mission Data

#### Table: activities

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('puzzle', 'trivia', 'creative', 'communication')),
  description TEXT,
  instructions TEXT,

  -- Rewards
  intimacy_points INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,

  -- Difficulty (NEW in v2)
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 3),
  estimated_duration_minutes INTEGER DEFAULT 10,

  -- Branded Quest Support (NEW in v2)
  is_branded BOOLEAN DEFAULT false,
  sponsor_merchant_id UUID REFERENCES merchants(id),

  -- Configuration
  config JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_is_branded ON activities(is_branded);
CREATE INDEX idx_activities_sponsor ON activities(sponsor_merchant_id);
```

#### Table: activity_instances

```sql
CREATE TABLE activity_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),

  -- Progress & Result
  progress JSONB,
  result JSONB,

  -- Rewards (NEW in v2)
  coins_earned INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_instances_match ON activity_instances(match_id);
CREATE INDEX idx_activity_instances_status ON activity_instances(status);
CREATE INDEX idx_activity_instances_expires ON activity_instances(expires_at);
```

### 4.4 Communication Data

#### Table: messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),

  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'icebreaker')),

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

#### Table: typing_status

```sql
CREATE TABLE typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(match_id, user_id)
);

CREATE INDEX idx_typing_match ON typing_status(match_id);
```

### 4.5 Intimacy & Unlock Data

#### Table: intimacy_scores

```sql
CREATE TABLE intimacy_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,

  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  unlocks VARCHAR(50)[] DEFAULT '{}',

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intimacy_match ON intimacy_scores(match_id);
```

#### Table: unlock_history

```sql
CREATE TABLE unlock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,

  unlock_type VARCHAR(50) NOT NULL CHECK (unlock_type IN ('real_name', 'photo', 'occupation', 'voice_call', 'video_call', 'paradise_mode')),
  unlocked_by_user_id UUID NOT NULL REFERENCES users(id),

  requested_at TIMESTAMP,
  unlocked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_unlock_match ON unlock_history(match_id);
CREATE INDEX idx_unlock_type ON unlock_history(unlock_type);
```

### 4.6 Date Planning Data (NEW)

#### Table: date_venues

```sql
CREATE TABLE date_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  venue_type VARCHAR(50) NOT NULL CHECK (venue_type IN ('restaurant', 'cafe', 'activity', 'movie', 'other')),
  description TEXT,

  -- Location
  address TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),

  -- Details
  price_range INTEGER CHECK (price_range >= 1 AND price_range <= 4),
  cuisine_type VARCHAR(50),
  ambiance_tags JSONB DEFAULT '[]',
  opening_hours JSONB,

  -- Booking
  booking_enabled BOOLEAN DEFAULT false,

  -- Media
  photos JSONB DEFAULT '[]',

  -- Rating
  rating DECIMAL(3, 2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_venues_merchant ON date_venues(merchant_id);
CREATE INDEX idx_venues_type ON date_venues(venue_type);
CREATE INDEX idx_venues_location ON date_venues(location_lat, location_lng);
CREATE INDEX idx_venues_price ON date_venues(price_range);
```

#### Table: date_bookings

```sql
CREATE TABLE date_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES date_venues(id),
  initiated_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Booking Details
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  party_size INTEGER DEFAULT 2,
  special_requests TEXT,

  -- Confirmation
  confirmation_code VARCHAR(50) UNIQUE,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Voucher
  voucher_applied_id UUID REFERENCES user_rewards(id),

  -- Split Bill
  split_bill_preference VARCHAR(20) DEFAULT 'equal' CHECK (split_bill_preference IN ('equal', 'one_pays', 'custom')),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_match ON date_bookings(match_id);
CREATE INDEX idx_bookings_venue ON date_bookings(venue_id);
CREATE INDEX idx_bookings_date ON date_bookings(booking_date);
CREATE INDEX idx_bookings_status ON date_bookings(status);
```

#### Table: qr_checkins

```sql
CREATE TABLE qr_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES date_venues(id),
  booking_id UUID REFERENCES date_bookings(id),

  qr_code VARCHAR(255) NOT NULL,
  coins_earned INTEGER DEFAULT 0,

  checked_in_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkins_user ON qr_checkins(user_id);
CREATE INDEX idx_checkins_venue ON qr_checkins(venue_id);
CREATE INDEX idx_checkins_date ON qr_checkins(checked_in_at);
```

### 4.7 PlayCoin & Transaction Data (NEW)

#### Table: playcoin_wallets

```sql
CREATE TABLE playcoin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON playcoin_wallets(user_id);
```

#### Table: playcoin_transactions

```sql
CREATE TABLE playcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES playcoin_wallets(id) ON DELETE CASCADE,

  -- Transaction Details
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'burn', 'purchase', 'exchange')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Source Tracking
  source VARCHAR(50) NOT NULL,
  reference_id UUID,

  -- Additional Data
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON playcoin_transactions(wallet_id);
CREATE INDEX idx_transactions_type ON playcoin_transactions(type);
CREATE INDEX idx_transactions_created ON playcoin_transactions(created_at DESC);
CREATE INDEX idx_transactions_source ON playcoin_transactions(source);
```

#### Table: daily_checkins

```sql
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  checkin_date DATE NOT NULL,
  streak_count INTEGER DEFAULT 1,
  coins_earned INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, checkin_date)
);

CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);
```

#### Table: rewards

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('powerup', 'avatar_item', 'voucher', 'partner_exchange')),

  coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
  stock_quantity INTEGER, -- NULL = unlimited

  partner_id UUID REFERENCES merchants(id),

  is_active BOOLEAN DEFAULT true,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_type ON rewards(type);
CREATE INDEX idx_rewards_active ON rewards(is_active);
CREATE INDEX idx_rewards_partner ON rewards(partner_id);
```

#### Table: user_rewards

```sql
CREATE TABLE user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  transaction_id UUID REFERENCES playcoin_transactions(id),

  status VARCHAR(20) DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'used', 'expired')),

  redeemed_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status);
CREATE INDEX idx_user_rewards_expires ON user_rewards(expires_at);
```

### 4.8 B2B Merchant Data (NEW)

#### Table: merchants

```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business Info
  name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('restaurant', 'cafe', 'brand', 'venue', 'other')),
  description TEXT,

  -- Contact
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  address TEXT,

  -- Branding
  logo_url TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  tier VARCHAR(20) DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise')),

  -- API
  api_key VARCHAR(255) UNIQUE,

  -- Additional Data
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_tier ON merchants(tier);
CREATE INDEX idx_merchants_api_key ON merchants(api_key);
```

#### Table: merchant_users

```sql
CREATE TABLE merchant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100) NOT NULL,

  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  permissions JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_merchant_users_merchant ON merchant_users(merchant_id);
CREATE INDEX idx_merchant_users_email ON merchant_users(email);
```

### 4.9 Campaign & Quest Data (NEW)

#### Table: campaigns

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Campaign Info
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('branded_quest', 'voucher', 'promotion')),
  description TEXT,

  -- Budget
  budget DECIMAL(10, 2) NOT NULL,
  spent DECIMAL(10, 2) DEFAULT 0,
  cpa_rate DECIMAL(10, 2),
  cpmi_rate DECIMAL(10, 2),

  -- Targeting
  target_audience JSONB DEFAULT '{}',

  -- Schedule
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'completed')),

  -- Results
  metrics JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_merchant ON campaigns(merchant_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
```

#### Table: branded_quests

```sql
CREATE TABLE branded_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id),

  -- Quest Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Rewards
  coin_reward INTEGER DEFAULT 0,
  voucher_reward_id UUID REFERENCES rewards(id),

  -- Limits
  max_completions INTEGER,
  completion_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quests_campaign ON branded_quests(campaign_id);
CREATE INDEX idx_quests_activity ON branded_quests(activity_id);
```

#### Table: quest_completions

```sql
CREATE TABLE quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branded_quest_id UUID NOT NULL REFERENCES branded_quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id),

  completed_at TIMESTAMP DEFAULT NOW(),
  reward_granted BOOLEAN DEFAULT false,

  UNIQUE(branded_quest_id, user_id)
);

CREATE INDEX idx_completions_quest ON quest_completions(branded_quest_id);
CREATE INDEX idx_completions_user ON quest_completions(user_id);
```

### 4.10 Analytics & Behavioral Data (NEW)

#### Table: user_behavioral_profiles

```sql
CREATE TABLE user_behavioral_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  persona_type VARCHAR(50) CHECK (persona_type IN ('caregiver', 'strategist', 'explorer', 'achiever')),

  -- Behavioral Data
  play_patterns JSONB DEFAULT '{}',
  preference_scores JSONB DEFAULT '{}',
  activity_history_summary JSONB DEFAULT '{}',
  date_preferences JSONB DEFAULT '{}',
  spending_patterns JSONB DEFAULT '{}',

  last_analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON user_behavioral_profiles(user_id);
CREATE INDEX idx_profiles_persona ON user_behavioral_profiles(persona_type);
```

#### Table: aggregated_insights

```sql
CREATE TABLE aggregated_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('trend', 'segment', 'behavior')),

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  segment_criteria JSONB DEFAULT '{}',
  metrics JSONB NOT NULL,
  sample_size INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_insights_type ON aggregated_insights(report_type);
CREATE INDEX idx_insights_period ON aggregated_insights(period_start, period_end);
```

#### Table: campaign_events

```sql
CREATE TABLE campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('impression', 'click', 'quest_start', 'quest_complete', 'appointment', 'conversion')),

  user_id UUID REFERENCES users(id),
  match_id UUID REFERENCES matches(id),

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_campaign ON campaign_events(campaign_id);
CREATE INDEX idx_events_type ON campaign_events(event_type);
CREATE INDEX idx_events_created ON campaign_events(created_at);
CREATE INDEX idx_events_user ON campaign_events(user_id);
```

### 4.11 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PlayMyDate v2 ERD                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌────────────┐     ┌────────────────┐          │
│  │  users  │────<│ matches │>────│ messages   │     │ activity_      │          │
│  │         │     │         │     │            │     │ instances      │          │
│  └────┬────┘     └────┬────┘     └────────────┘     └───────┬────────┘          │
│       │               │                                     │                    │
│       │               │          ┌────────────────┐         │                    │
│       │               └──────────│ intimacy_      │─────────┘                    │
│       │                          │ scores         │                              │
│       │                          └────────────────┘                              │
│       │                                                                          │
│       │     ┌─────────────────────────────────────────────────────────────┐     │
│       │     │                    PlayCoin Domain                           │     │
│       │     │  ┌──────────────┐     ┌────────────────────┐                │     │
│       ├─────│  │ playcoin_    │────<│ playcoin_          │                │     │
│       │     │  │ wallets      │     │ transactions       │                │     │
│       │     │  └──────────────┘     └────────────────────┘                │     │
│       │     │                                                              │     │
│       │     │  ┌──────────────┐     ┌────────────────────┐                │     │
│       ├─────│  │ daily_       │     │ user_rewards       │────────────────│     │
│       │     │  │ checkins     │     │                    │                │     │
│       │     │  └──────────────┘     └─────────┬──────────┘                │     │
│       │     │                                 │                            │     │
│       │     │                       ┌─────────┴──────────┐                │     │
│       │     │                       │ rewards            │                │     │
│       │     │                       └────────────────────┘                │     │
│       │     └─────────────────────────────────────────────────────────────┘     │
│       │                                                                          │
│       │     ┌─────────────────────────────────────────────────────────────┐     │
│       │     │                    Date Planning Domain                      │     │
│       │     │  ┌──────────────┐     ┌────────────────────┐                │     │
│       │     │  │ date_venues  │────<│ date_bookings      │                │     │
│       │     │  └──────────────┘     └─────────┬──────────┘                │     │
│       │     │                                 │                            │     │
│       │     │                       ┌─────────┴──────────┐                │     │
│       ├─────│                       │ qr_checkins        │                │     │
│       │     │                       └────────────────────┘                │     │
│       │     └─────────────────────────────────────────────────────────────┘     │
│       │                                                                          │
│       │     ┌─────────────────────────────────────────────────────────────┐     │
│       │     │                    B2B Domain                                │     │
│       │     │  ┌──────────────┐     ┌────────────────────┐                │     │
│       │     │  │ merchants    │────<│ merchant_users     │                │     │
│       │     │  └──────┬───────┘     └────────────────────┘                │     │
│       │     │         │                                                    │     │
│       │     │         │             ┌────────────────────┐                │     │
│       │     │         └────────────<│ campaigns          │                │     │
│       │     │                       └─────────┬──────────┘                │     │
│       │     │                                 │                            │     │
│       │     │                       ┌─────────┴──────────┐                │     │
│       │     │                       │ branded_quests     │                │     │
│       │     │                       └─────────┬──────────┘                │     │
│       │     │                                 │                            │     │
│       │     │                       ┌─────────┴──────────┐                │     │
│       └─────│                       │ quest_completions  │                │     │
│             │                       └────────────────────┘                │     │
│             └─────────────────────────────────────────────────────────────┘     │
│                                                                                  │
│             ┌─────────────────────────────────────────────────────────────┐     │
│             │                    Analytics Domain                          │     │
│             │  ┌──────────────────────┐     ┌─────────────────────┐       │     │
│             │  │ user_behavioral_     │     │ aggregated_insights │       │     │
│             │  │ profiles             │     │                     │       │     │
│             │  └──────────────────────┘     └─────────────────────┘       │     │
│             │                                                              │     │
│             │  ┌──────────────────────┐                                   │     │
│             │  │ campaign_events      │                                   │     │
│             │  └──────────────────────┘                                   │     │
│             └─────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Edge Cases & Risks

### 5.1 Security Risks

#### 5.1.1 Data Privacy & PDPA Compliance

**Risk:** ข้อมูลส่วนตัวรั่วไหลหรือถูกเข้าถึงโดยไม่ได้รับอนุญาต

**Mitigation:**
- เข้ารหัสข้อมูลที่ยังไม่เปิดเผย (real_name, photo_url, occupation, phone)
- ใช้ Row-Level Security สำหรับ B2B data isolation
- Audit logging สำหรับทุกการเข้าถึงข้อมูลที่ sensitive
- ตรวจสอบ intimacy score ก่อนส่งข้อมูลที่ปลดล็อก
- HTTPS everywhere (TLS 1.3)
- PCI DSS compliance สำหรับ payment data

#### 5.1.2 PlayCoin Fraud Prevention

**Risk:** การโกง PlayCoin (fake check-ins, bot farming, abuse)

**Mitigation:**
- Rate limiting: Daily check-in 1 ครั้ง/วัน, QR scan จำกัดต่อ venue/user
- Device fingerprinting: ตรวจจับบัญชีซ้ำ
- Location verification: QR check-in ต้องอยู่ใกล้ร้าน
- Transaction atomicity: ใช้ database transactions
- Suspicious activity detection: Monitor unusual patterns
- IP rate limiting: จำกัด requests per IP

#### 5.1.3 B2B Data Isolation

**Risk:** Merchant เห็นข้อมูลของ Merchant อื่น

**Mitigation:**
- Row-Level Security (RLS) policies
- API authentication แยก session store
- Query parameterization ทุก query
- Audit trail สำหรับ B2B actions
- Regular security audits

#### 5.1.4 Authentication & Authorization

**Risk:** Unauthorized access, Session hijacking

**Mitigation:**
- Session-based auth ด้วย Lucia
- Argon2id password hashing
- Session expiration (30 วัน)
- CSRF protection
- Secure cookie settings (httpOnly, secure, sameSite)
- MFA สำหรับ B2B (optional)

### 5.2 Data Consistency

#### 5.2.1 PlayCoin Transaction Atomicity

**Risk:** Balance ไม่ตรงกับ transactions, Race conditions

**Mitigation:**
```typescript
// Use database transaction
await db.transaction(async (tx) => {
  // Lock wallet row
  const wallet = await tx.query(
    'SELECT * FROM playcoin_wallets WHERE user_id = $1 FOR UPDATE',
    [userId]
  );

  // Check balance
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // Create transaction
  await tx.query(
    'INSERT INTO playcoin_transactions ...',
    [walletId, type, amount, wallet.balance - amount, source]
  );

  // Update balance
  await tx.query(
    'UPDATE playcoin_wallets SET balance = balance - $1 WHERE id = $2',
    [amount, walletId]
  );
});
```

#### 5.2.2 Chemistry Score Sync

**Risk:** Chemistry score ไม่อัพเดทเมื่อทำกิจกรรมหรือส่งข้อความ

**Mitigation:**
- Trigger-based updates หรือ service-level sync
- Event-driven architecture (emit events on actions)
- Periodic recalculation job
- Optimistic UI updates with server confirmation

#### 5.2.3 Match Status Consistency

**Risk:** Race condition เมื่อ unmatch พร้อมกัน

**Mitigation:**
- Database constraints (UNIQUE)
- Optimistic locking with version column
- Status transition validation

#### 5.2.4 Booking Conflict Resolution

**Risk:** Double booking สำหรับ slot เดียวกัน

**Mitigation:**
- Unique constraint on (venue_id, booking_date, booking_time)
- Availability check with row locking
- Confirmation within timeout (15 minutes hold)

### 5.3 Performance Issues

#### 5.3.1 Matching Algorithm Scalability

**Risk:** การจับคู่ช้าเมื่อมีผู้ใช้จำนวนมาก

**Mitigation:**
- Pre-compute compatibility scores (background job)
- Index on playing_style and interests (GIN index)
- Limit candidate pool (location, preferences)
- Cache frequent queries
- Async matching with queue (Phase 2)

#### 5.3.2 Message Pagination

**Risk:** การโหลดข้อความช้าเมื่อมีจำนวนมาก

**Mitigation:**
- Cursor-based pagination
- Index on (match_id, created_at DESC)
- Limit message fetch (50 per page)
- Virtualized list rendering on frontend

#### 5.3.3 Analytics Aggregation

**Risk:** Report generation ช้าสำหรับ B2B

**Mitigation:**
- Pre-aggregated tables (daily, weekly)
- Background report generation
- Caching for common queries
- Materialized views (if needed)

#### 5.3.4 Media Loading

**Risk:** รูปภาพและ Voice Notes โหลดช้า

**Mitigation:**
- Vercel Blob CDN caching
- Image optimization (WebP, responsive sizes)
- Lazy loading
- Progressive image loading

### 5.4 Business Logic Edge Cases

#### 5.4.1 User Unmatches During Activity

**Scenario:** User A และ B กำลังทำกิจกรรมร่วมกัน แล้ว A กด Unmatch

**Solution:**
- Cancel activity instance (status = 'cancelled')
- No coins earned for either party
- Notify both users
- Clear typing status

```typescript
async function handleUnmatch(matchId: string, userId: string) {
  await db.transaction(async (tx) => {
    // Cancel active activities
    await tx.query(`
      UPDATE activity_instances
      SET status = 'cancelled'
      WHERE match_id = $1 AND status IN ('pending', 'in_progress')
    `, [matchId]);

    // Update match status
    await tx.query(`
      UPDATE matches
      SET status = 'unmatched', updated_at = NOW()
      WHERE id = $1
    `, [matchId]);

    // Notify partner (async)
    await notifyUser(partnerId, 'match_ended');
  });
}
```

#### 5.4.2 PlayCoin Refund Scenarios

**Scenario:** User แลก Reward แล้ว Reward หมดอายุก่อนใช้

**Solution:**
- Expired rewards = no refund (ระบุใน T&C)
- System error refund = manual process
- Duplicate transaction = auto refund

#### 5.4.3 Booking Cancellation Policies

**Scenario:** User จองแล้วยกเลิก

**Solution:**
- > 24 ชั่วโมงก่อน: Full refund (ถ้าจ่ายผ่านแอป)
- < 24 ชั่วโมง: No refund
- Voucher: Return to inventory
- Notify merchant

#### 5.4.4 Campaign Budget Exhaustion

**Scenario:** Budget หมดระหว่าง Quest

**Solution:**
- Users ที่เริ่มแล้ว: ให้ทำจนจบและได้ reward
- Users ใหม่: แสดง "Campaign ended"
- Alert merchant ก่อนหมด (80%, 90%, 100%)

### 5.5 External Service Failures

#### 5.5.1 Payment Gateway Failures

**Risk:** Stripe ล้มเหลว

**Mitigation:**
- Webhook retry mechanism
- Idempotency keys
- Graceful error handling
- Manual reconciliation process

#### 5.5.2 Email Service Failures

**Risk:** Resend ล้มเหลว

**Mitigation:**
- Queue with retry (exponential backoff)
- Fallback to secondary provider (Phase 2)
- In-app notification as backup

#### 5.5.3 File Storage Failures

**Risk:** Vercel Blob ล้มเหลว

**Mitigation:**
- Retry uploads
- Show placeholder/fallback images
- Store upload status in DB

---

## 6. Design Notes

### 6.1 PlayCoin Economy Design

#### 6.1.1 Earn-Burn Balance

เป้าหมาย: สร้าง sustainable economy ที่ไม่เกิด hyperinflation

**Earn Rates:**

| Source | Daily Max | Monthly Max |
|--------|-----------|-------------|
| Daily Check-in | 24 coins (7-day streak) | ~500 coins |
| Daily Missions | 150 coins (3 missions) | ~4,500 coins |
| Co-op Games | Unlimited | ~3,000 coins |
| QR Check-in | 200 coins/venue/day | ~1,000 coins |
| Referral | 100 coins/referral | 1,000 coins |
| **Total Potential** | | ~10,000 coins/month |

**Burn Rates:**

| Use | Cost Range |
|-----|------------|
| Power-ups | 10-50 coins |
| Avatar Items | 50-200 coins |
| Premium Features | 50-200 coins |
| Real-world Rewards | 500+ coins |
| Partner Exchange | 500+ coins (100:40-50 ratio) |

**Inflation Controls:**
- Reward costs scale with earning rates
- Limited-time items create scarcity
- Partner exchange provides sink
- Expiring rewards encourage spending

#### 6.1.2 Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PlayCoin Transaction Flow                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User Action]                                                       │
│       │                                                              │
│       ↓                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  API Route                                                   │    │
│  │  1. Validate request                                         │    │
│  │  2. Check permissions                                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │                                                              │
│       ↓                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Service Layer (playcoin.ts)                                 │    │
│  │  1. Start transaction                                        │    │
│  │  2. Lock wallet (FOR UPDATE)                                 │    │
│  │  3. Validate balance (if burn)                               │    │
│  │  4. Create transaction record                                │    │
│  │  5. Update wallet balance                                    │    │
│  │  6. Update lifetime_earned/spent                             │    │
│  │  7. Commit transaction                                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│       │                                                              │
│       ↓                                                              │
│  [Return new balance]                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chemistry Meter Design

#### 6.2.1 Scoring Formula

```typescript
const CHEMISTRY_WEIGHTS = {
  message: 1,
  game_complete: 5,
  mission_complete: 10,
  voice_call: 10,
  video_call: 15,
  date_checkin: 20
};

const DECAY_RATE = 10; // points per day after 3 days inactive

function calculateChemistry(matchId: string): number {
  // Get all interactions
  const interactions = await getInteractions(matchId);

  // Calculate base score
  let score = interactions.reduce((sum, i) => {
    return sum + (CHEMISTRY_WEIGHTS[i.type] || 0);
  }, 0);

  // Apply decay
  const daysSinceLastActivity = getDaysSince(match.lastActivityAt);
  if (daysSinceLastActivity > 3) {
    const decayDays = daysSinceLastActivity - 3;
    score = Math.max(0, score - (decayDays * DECAY_RATE));
  }

  // Cap at 100
  return Math.min(100, score);
}
```

#### 6.2.2 Threshold Unlocks

| Level | Score | Unlock | Notes |
|-------|-------|--------|-------|
| 1 | 0-24 | Basic Chat | Default |
| 2 | 25 | Real Name | Both parties must reach |
| 3 | 45 | Photo | Mutual consent required |
| 4 | 65 | Occupation | Mutual consent required |
| 5 | 85 | Voice/Video Call | Both must have Chemistry 85+ |
| 6 | 100 | Paradise Mode | Full access to date planning |

#### 6.2.3 Request Reveal Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                    Request Reveal Flow                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [User A requests reveal (photo)]                                  │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  System checks:                                          │      │
│  │  - Is this unlock type already unlocked? → Error         │      │
│  │  - Is there pending request? → Error (1/type/day)        │      │
│  │  - Create pending request                                │      │
│  └─────────────────────────────────────────────────────────┘      │
│       │                                                            │
│       ↓                                                            │
│  [Notify User B]                                                   │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  User B decides:                                         │      │
│  │  - Accept → Unlock for both                              │      │
│  │  - Decline → No penalty, notify A                        │      │
│  │  - Ignore → Request expires in 48h                       │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### 6.3 Matching Algorithm

#### 6.3.1 Compatibility Calculation

```typescript
function calculateCompatibility(user1: User, user2: User): number {
  // Jaccard Similarity for Playing Style (40%)
  const playingStyleScore = jaccardSimilarity(
    user1.playingStyle,
    user2.playingStyle
  ) * 40;

  // Jaccard Similarity for Interests (60%)
  const interestsScore = jaccardSimilarity(
    user1.interests,
    user2.interests
  ) * 60;

  return Math.round(playingStyleScore + interestsScore);
}

function jaccardSimilarity(set1: string[], set2: string[]): number {
  const intersection = set1.filter(x => set2.includes(x));
  const union = [...new Set([...set1, ...set2])];

  if (union.length === 0) return 0;
  return intersection.length / union.length;
}
```

#### 6.3.2 Matching Process

```
┌───────────────────────────────────────────────────────────────────┐
│                    Matching Process                                │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [User requests new match]                                         │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  1. Get candidate pool:                                  │      │
│  │     - Not already matched                                │      │
│  │     - Not blocked                                        │      │
│  │     - Active in last 30 days                             │      │
│  │     - Apply user filters (age, location)                 │      │
│  └─────────────────────────────────────────────────────────┘      │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  2. Calculate compatibility for each candidate           │      │
│  │     (Use pre-computed scores if available)               │      │
│  └─────────────────────────────────────────────────────────┘      │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  3. Filter: compatibility >= 30%                         │      │
│  └─────────────────────────────────────────────────────────┘      │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  4. Sort by compatibility (desc)                         │      │
│  │     + Add randomness factor for variety                  │      │
│  └─────────────────────────────────────────────────────────┘      │
│       │                                                            │
│       ↓                                                            │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │  5. Create match record                                  │      │
│  │     - Initialize chemistry_score = 0                     │      │
│  │     - Create intimacy_scores record                      │      │
│  │     - Send Auto-Icebreaker                               │      │
│  └─────────────────────────────────────────────────────────┘      │
│       │                                                            │
│       ↓                                                            │
│  [Return match with compatibility breakdown]                       │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### 6.4 B2B Data Architecture

#### 6.4.1 Multi-Tenant Design

```sql
-- Row-Level Security Policy for campaigns
CREATE POLICY merchant_isolation ON campaigns
  USING (merchant_id = current_setting('app.current_merchant_id')::uuid);

-- Usage in API
async function getMerchantCampaigns(merchantId: string) {
  await db.query(`SET app.current_merchant_id = '${merchantId}'`);
  return db.query('SELECT * FROM campaigns');
}
```

#### 6.4.2 API Key Authentication

```typescript
// Middleware for B2B API
async function validateAPIKey(req: Request): Promise<Merchant> {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    throw new UnauthorizedError('API key required');
  }

  const merchant = await db.query(
    'SELECT * FROM merchants WHERE api_key = $1 AND status = $2',
    [apiKey, 'active']
  );

  if (!merchant) {
    throw new UnauthorizedError('Invalid API key');
  }

  return merchant;
}
```

### 6.5 Scalability Strategy

#### 6.5.1 Vercel Auto-Scaling

```
┌───────────────────────────────────────────────────────────────────┐
│                    Vercel Scaling Model                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [Incoming Requests]                                               │
│       │                                                            │
│       ↓                                                            │
│  [Edge Network] ─── Global CDN (300+ PoPs)                        │
│       │              Static assets cached at edge                  │
│       │                                                            │
│       ↓                                                            │
│  [Edge Middleware] ─── Auth check, Rate limiting                  │
│       │                 Runs at edge (fast)                        │
│       │                                                            │
│       ↓                                                            │
│  [Serverless Functions]                                            │
│       │  • Auto-scale 0 to ∞                                       │
│       │  • Cold start ~200-500ms                                   │
│       │  • Max duration: 10s (hobby), 60s (pro)                   │
│       │                                                            │
│       ↓                                                            │
│  [Neon PostgreSQL]                                                 │
│       • Serverless driver (HTTP-based)                             │
│       • Connection pooling built-in                                │
│       • Auto-scaling compute                                       │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

#### 6.5.2 Database Optimization

**Indexes:**
- ทุก foreign key
- Columns ที่ใช้ใน WHERE frequently
- GIN indexes สำหรับ array columns (playing_style, interests)
- Composite indexes สำหรับ common query patterns

**Connection Pooling:**
- Neon serverless driver จัดการ connection pooling อัตโนมัติ
- ไม่ต้องใช้ PgBouncer หรือ external pooler

#### 6.5.3 Caching Strategy (Phase 2)

```
┌───────────────────────────────────────────────────────────────────┐
│                    Caching Layers                                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Layer 1: Edge Cache (Vercel)                                      │
│  • Static pages                                                    │
│  • ISR pages (revalidate)                                          │
│  • API responses with Cache-Control                                │
│                                                                    │
│  Layer 2: Vercel KV (Phase 2)                                      │
│  • Session data                                                    │
│  • User preferences                                                │
│  • Frequently accessed data                                        │
│                                                                    │
│  Layer 3: Database                                                 │
│  • All persistent data                                             │
│  • Query result caching (pg_stat_statements)                       │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### 6.6 Implementation Priority

#### Phase 1: Core B2C + PlayCoin (MVP)

**Duration:** 8-12 weeks

**Features:**
- Authentication (Email/Password)
- Profile Management (Basic)
- AI Avatar Builder
- Matching Algorithm
- Chemistry Meter
- Basic Activities (3 types)
- Text Messaging
- Intimacy & Unlocks
- PlayCoin Wallet
- Daily Check-in
- Basic Rewards

**Infrastructure:**
- Next.js + Vercel deployment
- Neon PostgreSQL
- Vercel Blob
- Stripe (Subscription only)

#### Phase 2: Enhanced B2C + B2B Basics

**Duration:** 6-8 weeks

**Features:**
- Voice Note
- Daily Missions
- More Activities (5+ types)
- Voice/Video Call (Basic)
- Paradise Mode (Basic)
- Venue Search
- Booking System
- QR Check-in
- B2B Portal (MVP)
- Campaign Management (Basic)
- Branded Quests

**Infrastructure:**
- Daily.co integration
- Google Maps integration
- Vercel KV

#### Phase 3: Full B2B + Advanced Features

**Duration:** 8-10 weeks

**Features:**
- Full Campaign Management
- A/B Testing
- Target Audience Selection
- Analytics Dashboard
- Custom Reports
- Partner Point Exchange
- Push Notifications
- Advanced Matching (Behavioral)
- Premium Features (All)

**Infrastructure:**
- Web Push API
- Partner API integrations
- Advanced analytics pipeline

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **PlayCoin** | สกุลเงินเสมือนภายในแอปสำหรับแลกเปลี่ยน Value |
| **CPA** | Cost Per Appointment - ค่าธรรมเนียมเมื่อเกิดการนัดพบจริง |
| **CPMI** | Cost Per Meaningful Interaction - ค่าธรรมเนียมเมื่อเกิด Interaction ที่มีความหมาย |
| **Chemistry Meter** | ระบบวัดความสนิทระหว่างคู่ Match |
| **Paradise Mode** | โหมดพิเศษหลังจาก Chemistry Meter เต็ม สำหรับวางแผนเดทจริง |
| **Branded Quest** | ภารกิจที่สนับสนุนโดยแบรนด์พาร์ทเนอร์ |
| **Merchant** | ธุรกิจพาร์ทเนอร์ที่ใช้งาน B2B Platform |
| **Behavioral Persona** | การจัดกลุ่มผู้ใช้ตามพฤติกรรมการเล่น (Caregiver, Strategist, Explorer, Achiever) |
| **ISR** | Incremental Static Regeneration - เทคนิค Next.js สำหรับ update static pages |
| **RLS** | Row-Level Security - การควบคุมการเข้าถึงข้อมูลระดับ row ใน PostgreSQL |

### B. Related Documents

| Document | Path | Description |
|----------|------|-------------|
| BRD v1 | `_docs/01-brd/brd.md` | Business Requirements v1 |
| BRD v2 | `_docs/01-brd/brd-v2.md` | Business Requirements v2 |
| SRD v1 | `_docs/02-srd/srd.md` | System Requirements v1 |
| SRD v2 | `_docs/02-srd/srd-v2.md` | System Requirements v2 |
| SDD v1 | `_docs/03-sdd/sdd.md` | System Design v1 |

### C. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | - | - | Initial SDD for Dating App with Gamification (Microservices) |
| 2.0 | Feb 2026 | - | Major update: Next.js Monolith, B2B Platform, PlayCoin Loyalty, Enhanced B2C |

---

> **Document Status:** Draft
> **Next Review:** After SRD v2 Final Approval
> **Approvers:** Product Owner, Tech Lead, Business Stakeholders
