# SRD v2: System Requirement Document - PlayMyDate

> **Version:** 2.0
> **วันที่:** กุมภาพันธ์ 2026
> **สถานะ:** Draft
> **อ้างอิง:** BRD v2 - Unified Relationship Economy Platform

---

## 0. Changes from v1

ส่วนนี้อธิบายการเปลี่ยนแปลงและการพัฒนาจาก SRD v1 เพื่อให้เห็นภาพรวมของวิวัฒนาการของระบบ

### 0.1 Document Change Summary

| หัวข้อ | v1 | v2 | ผลกระทบ |
|--------|----|----|---------|
| **ขอบเขตผลิตภัณฑ์** | Dating App with Gamification | Unified Relationship Economy Platform | เปลี่ยนแปลงสถาปัตยกรรมหลัก |
| **กลุ่มเป้าหมาย** | B2C เท่านั้น | B2C + B2B | เพิ่ม Portal และ Services ใหม่ |
| **โมเดลรายได้** | Subscription + Commission | Multi-layered (Subscription + PlayCoin + CPA/CPMI + Data) | ระบบ Billing ใหม่ |
| **โครงสร้างข้อมูล** | 8 ตาราง | 25+ ตาราง | ขยาย Database อย่างมาก |
| **API Endpoints** | ~18 endpoints | ~60+ endpoints | เพิ่ม B2B API Domain |
| **User Retention** | จบที่เดท | Ongoing Economy | PlayCoin Ecosystem |

### 0.2 Architectural Changes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    v1 Architecture (Dating App)                      │
├─────────────────────────────────────────────────────────────────────┤
│  [Next.js App] → [API Routes] → [PostgreSQL]                         │
│       │                │              │                              │
│    Matches          Auth, CRUD     8 Tables                          │
│    Messages         Matching       (users, matches, messages,        │
│    Activities       Intimacy        activities, etc.)                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                        Evolution to v2
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              v2 Architecture (Next.js + Vercel)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Next.js App - Vercel]                                              │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  /app                                                     │       │
│  │  ├── (b2c)/* ─── B2C Pages (Matches, Chat, Wallet)       │       │
│  │  ├── (b2b)/* ─── B2B Portal (Dashboard, Campaigns)       │       │
│  │  └── /api/* ─── API Routes (60+ Serverless Functions)    │       │
│  │                                                           │       │
│  │  /lib                                                     │       │
│  │  ├── db.ts ─── Database Queries                          │       │
│  │  ├── auth.ts ─── Authentication (Lucia)                  │       │
│  │  └── services/* ─── Business Logic Modules               │       │
│  └──────────────────────────────────────────────────────────┘       │
│              │                                                       │
│              ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  [PostgreSQL - Neon Serverless]                           │       │
│  │  └── 25+ Tables (Core, PlayCoin, B2B, Analytics)         │       │
│  └──────────────────────────────────────────────────────────┘       │
│              │                                                       │
│              ↓                                                       │
│  [Vercel Blob] ─── Media Storage (Images, Voice Notes)              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 0.3 New Feature Modules

| Module | คำอธิบาย | อ้างอิง BRD |
|--------|----------|-------------|
| **PlayCoin Wallet** | ระบบจัดการสกุลเงินภายในแอป | Section 7.2 |
| **Merchant Portal** | หน้าจัดการสำหรับพาร์ทเนอร์ธุรกิจ | Section 7.3 |
| **Smart Campaigner** | เครื่องมือสร้าง Branded Quest และแคมเปญ | Section 7.3 |
| **Insight Dashboard** | Dashboard วิเคราะห์และรายงาน B2B | Section 7.3 |
| **Date Booking** | ระบบจองสถานที่เดท | Section 7.1 Phase 4 |
| **AI Avatar** | ระบบสร้าง Avatar แทนรูปจริง | Section 7.1 Phase 1 |

### 0.4 Enhanced Existing Features

| Feature | ความสามารถ v1 | การพัฒนาใน v2 |
|---------|---------------|---------------|
| **Activity System** | เกมพื้นฐาน 5 แบบ | + Branded Quests, + Coin Rewards, + Daily Missions, + AI Game Master |
| **Matching System** | Jaccard Similarity | + Play Pattern Analysis, + Chemistry Meter, + B2B Targeting Data |
| **Profile System** | ข้อมูลพื้นฐาน + Unlock | + AI Avatar, + Voice Notes, + Behavioral Persona |
| **Paradise Mode** | แนะนำสถานที่ | + Booking Integration, + Split Bill, + Vouchers, + QR Check-in |
| **Communication** | Text Messages + Typing | + Voice/Video Call (Post-unlock), + AI Icebreaker |

### 0.5 Data Model Evolution

**ตารางเดิม (Enhanced):**
- `users` - เพิ่ม avatar_config, voice_note_url, behavioral_persona, subscription fields
- `activities` - เพิ่ม is_branded, sponsor_merchant_id, coin_reward, difficulty_level
- `matches` - เพิ่ม chemistry_score, mission_streak, paradise_mode_unlocked

**ตารางใหม่:**
| Domain | ตาราง |
|--------|-------|
| PlayCoin | playcoin_wallets, playcoin_transactions, daily_checkins, rewards, user_rewards |
| B2B | merchants, merchant_users, campaigns, branded_quests, quest_completions |
| Date Planning | date_venues, date_bookings, qr_checkins |
| Analytics | user_behavioral_profiles, aggregated_insights, campaign_events |

### 0.6 API Changes

| v1 Endpoint | สถานะใน v2 | หมายเหตุ |
|-------------|------------|----------|
| `/api/auth/*` | คงไว้ | ไม่เปลี่ยนแปลง |
| `/api/users/*` | คงไว้ | ไม่เปลี่ยนแปลง |
| `/api/matches/*` | ปรับปรุง | เพิ่ม chemistry tracking |
| `/api/messages/*` | คงไว้ | ไม่เปลี่ยนแปลง |
| `/api/activities/*` | ปรับปรุง | เพิ่ม branded quests, daily missions |
| `/api/intimacy/*` | คงไว้ | ไม่เปลี่ยนแปลง |
| **NEW:** `/api/playcoin/*` | เพิ่มใหม่ | 7 endpoints |
| **NEW:** `/api/b2b/*` | เพิ่มใหม่ | 20+ endpoints |
| **NEW:** `/api/dates/*` | เพิ่มใหม่ | 8 endpoints |
| **NEW:** `/api/webhooks/*` | เพิ่มใหม่ | 2+ endpoints |

---

## 1. System Overview

### 1.1 Platform Definition

**PlayMyDate v2** คือ **"Unified Relationship Economy Platform"** ที่ยกระดับจากแอปหาคู่ (Dating App) ไปสู่ระบบนิเวศทางเศรษฐกิจที่ผสานรวม 3 แกนธุรกิจเข้าด้วยกัน:

1. **Community Platform** - สร้าง Traffic และ Engagement ผ่านเกมและกิจกรรม
2. **Loyalty Program** - สร้าง Stickiness ด้วย PlayCoin ที่มีมูลค่าจริง
3. **Market CRM** - สร้างรายได้ผ่าน B2B Services และ Data Analytics

**Core Value Proposition:**
*"เปลี่ยนการหาคู่ที่น่าเบื่อและฉาบฉวย ให้กลายเป็นประสบการณ์ Gamified Discovery ที่มี AI ช่วยบริหารความสัมพันธ์ตั้งแต่ต้นจนถึงเดทแรกจริง พร้อมสร้าง Economy ที่ยั่งยืนสำหรับทั้งผู้ใช้และพาร์ทเนอร์"*

### 1.2 Core Value Streams

```
┌─────────────────────────────────────────────────────────────┐
│                    PlayMyDate Economy                        │
├─────────────────────────────────────────────────────────────┤
│  Community (Magnet)  →  สร้าง Traffic & Engagement          │
│         ↓                    ผ่าน Games & Activities         │
│  Loyalty (Blood)     →  สร้าง Stickiness ด้วย PlayCoin      │
│         ↓                    Earn-Burn Economy               │
│  CRM (Brain)         →  สร้าง Revenue ผ่าน B2B Services     │
│                              CPA, CPMI, Data Analytics       │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 System Architecture Overview

ระบบใช้ **Next.js Monolith** บน **Vercel** แบ่งออกเป็น 3 ชั้น:

**1. Presentation Layer** (`/app`)
- B2C Routes: `/(b2c)/*` - หน้า Matches, Chat, Wallet, Profile
- B2B Routes: `/(b2b)/*` - หน้า Dashboard, Campaigns, Analytics
- Shared Components: `/components`
- Mobile-responsive Design

**2. API Layer** (`/app/api`)
- Next.js API Routes (Serverless Functions)
- Middleware สำหรับ Auth & Rate Limiting
- Business Logic Modules (`/lib/services/*`)

**3. Data Layer**
- PostgreSQL via Neon (Serverless Driver)
- Vercel Blob สำหรับ Media Files

### 1.4 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 16+ (App Router) | Full-stack Web Framework |
| **UI** | React 19+, Tailwind CSS v4 | Component Library & Styling |
| **Auth** | Lucia v3 + Argon2id | Session-based Authentication |
| **Database** | PostgreSQL (Neon Serverless) | Primary Data Store |
| **Storage** | Vercel Blob | Media Files (Images, Voice Notes) |
| **Hosting** | Vercel | Serverless Deployment |
| **Payment** | Stripe | Payment Processing |

**หมายเหตุ:** External services อื่นๆ เช่น Maps API, Video Call, Push Notifications จะพิจารณาเพิ่มเติมใน Phase 2 ตามความจำเป็น

---

## 2. Functional Requirements

### 2.1 B2C Features - User Journey (4 Phases)

#### 2.1.1 Phase 1: The Masquerade (ช่วงเริ่มต้น - ซ่อนตัวตน)

**FR-1.1.1 AI Avatar Generator**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.1.1.1 | ระบบต้องให้ผู้ใช้สร้าง Avatar แทนรูปจริงได้ |
| FR-1.1.1.2 | ระบบต้องมีตัวเลือก Avatar หลากหลายสไตล์ (Cartoon, Anime, Minimal) |
| FR-1.1.1.3 | ผู้ใช้สามารถปรับแต่งสี ทรงผม เสื้อผ้า และ Accessories |
| FR-1.1.1.4 | ระบบบันทึก Avatar Config เป็น JSON เพื่อ Render ซ้ำได้ |
| FR-1.1.1.5 | Avatar ต้องสะท้อนบุคลิกของผู้ใช้ตาม Personality Quiz |

**FR-1.1.2 Voice Note Introduction**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.1.2.1 | ผู้ใช้สามารถบันทึกเสียงแนะนำตัวความยาว 15-60 วินาที |
| FR-1.1.2.2 | ระบบต้อง Transcode เสียงเป็น Format มาตรฐาน (AAC/MP3) |
| FR-1.1.2.3 | มีตัวอย่างคำถามให้ตอบในการบันทึก Voice Note |
| FR-1.1.2.4 | ผู้ใช้สามารถบันทึกใหม่ได้ไม่จำกัดครั้งก่อน Submit |
| FR-1.1.2.5 | Voice Note ต้องผ่าน Content Moderation ก่อนเผยแพร่ |

**FR-1.1.3 Profile Management**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.1.3.1 | ผู้ใช้สร้างโปรไฟล์โดยไม่บังคับเปิดเผยรูปหรือข้อมูลจริงตั้งแต่แรก |
| FR-1.1.3.2 | ระบบเก็บข้อมูล Playing Style (Competitive, Cooperative, Creative, Explorer) |
| FR-1.1.3.3 | ระบบเก็บ Interests/Hobbies แบบ Multi-select |
| FR-1.1.3.4 | ผู้ใช้ระบุ Deal-breakers และ Must-haves |
| FR-1.1.3.5 | ระบบมี Personality Quiz เพื่อสร้าง Behavioral Persona |

**FR-1.1.4 AI Matchmaker**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.1.4.1 | ระบบจับคู่จาก Play Patterns และความสนใจ ไม่ใช่จากรูปหรือข้อความ |
| FR-1.1.4.2 | ใช้ Jaccard Similarity: 40% Playing Style + 60% Interests |
| FR-1.1.4.3 | Compatibility Score ต้อง >= 30% ถึงจะแนะนำ |
| FR-1.1.4.4 | ระบบแสดง Compatibility Breakdown ให้ผู้ใช้เห็น |
| FR-1.1.4.5 | จำกัดจำนวน Match ใหม่ต่อวันตามระดับสมาชิก |

#### 2.1.2 Phase 2: The Mission Run (ช่วงสร้างความสัมพันธ์)

**FR-1.2.1 Daily Mission System**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.2.1.1 | AI ส่งภารกิจรายวันให้คู่ Match ทำร่วมกัน |
| FR-1.2.1.2 | ภารกิจมี 3 ระดับ: Easy (10 coins), Medium (25 coins), Hard (50 coins) |
| FR-1.2.1.3 | ภารกิจหมดอายุใน 24 ชั่วโมง หากไม่ทำ |
| FR-1.2.1.4 | ทั้งสองฝ่ายต้อง Accept ภารกิจก่อนเริ่ม |
| FR-1.2.1.5 | Mission Streak: ทำต่อเนื่อง 7 วันได้ Bonus 100 coins |

**FR-1.2.2 Co-op Games Engine**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.2.2.1 | มินิเกมที่ต้องเล่นร่วมกัน 2 คน ไม่สามารถเล่นคนเดียวได้ |
| FR-1.2.2.2 | Game Types: Puzzle, Trivia, Creative, Communication |
| FR-1.2.2.3 | เกมต้องใช้เวลาไม่เกิน 5-10 นาที |
| FR-1.2.2.4 | บันทึก Game Result และ Interaction Patterns |
| FR-1.2.2.5 | AI วิเคราะห์พฤติกรรมเพื่อปรับปรุงการจับคู่ในอนาคต |

**ตัวอย่างเกม:**

| เกม | ประเภท | รายละเอียด |
|-----|--------|------------|
| The Blind Taste | Creative | ถ่ายรูปอาหาร แล้วทายกันว่ากินอะไร |
| Rescue Mission | Puzzle | Co-op Puzzle ที่ต้องสื่อสารกันถึงจะผ่าน |
| 2 Truths 1 Lie | Trivia | AI สร้างประโยค 3 ข้อ ให้ทายว่าข้อไหนจริง |
| Playlist Exchange | Creative | แนะนำเพลงให้กัน ทายว่าใครเลือกเพลงไหน |
| Would You Rather | Communication | ตอบคำถามสมมติ เปรียบเทียบคำตอบ |

**FR-1.2.3 Chemistry Meter**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.2.3.1 | แถบวัดคะแนนความสัมพันธ์จาก Interaction |
| FR-1.2.3.2 | คะแนนเพิ่มจาก: Messages (+1), Games (+5-20), Voice (+10), Video (+15) |
| FR-1.2.3.3 | คะแนนลดหาก Inactive เกิน 3 วัน (-10/วัน) |
| FR-1.2.3.4 | Chemistry Meter มี Threshold สำหรับ Unlock Features |
| FR-1.2.3.5 | แสดง Progress Bar และ Next Milestone |

**Chemistry Thresholds:**

| Level | คะแนน | Unlock |
|-------|-------|--------|
| 1 | 0-24 | Basic Chat |
| 2 | 25 | Real Name |
| 3 | 45 | Photo |
| 4 | 65 | Occupation |
| 5 | 85 | Voice/Video Call |
| 6 | 100 | Paradise Mode |

**FR-1.2.4 Auto-Icebreaker**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.2.4.1 | เกมเริ่มบทสนทนาให้ทันทีที่ Match สำเร็จ |
| FR-1.2.4.2 | AI สร้างคำถามเปิดบทสนทนาจาก Profile ทั้งสองฝ่าย |
| FR-1.2.4.3 | มีตัวเลือก Icebreaker หลายแบบให้เลือก |
| FR-1.2.4.4 | Icebreaker หมดอายุใน 48 ชั่วโมงหากไม่มีใครตอบ |
| FR-1.2.4.5 | หลังจบ Icebreaker ระบบแนะนำ Mission ถัดไป |

#### 2.1.3 Phase 3: The Reveal (ช่วงเปิดเผยตัวตน)

**FR-1.3.1 Gradual Reveal System**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.3.1.1 | ปลดล็อกข้อมูลจริงตามค่า Chemistry Meter |
| FR-1.3.1.2 | ข้อมูลแต่ละประเภทมี Threshold ต่างกัน |
| FR-1.3.1.3 | ระบบแจ้งเตือนเมื่อถึง Threshold ใหม่ |
| FR-1.3.1.4 | ผู้ใช้ต้อง Confirm ก่อนเปิดเผยข้อมูลจริง |
| FR-1.3.1.5 | บันทึก History ว่าใครเปิดเผยอะไรเมื่อไหร่ |

**FR-1.3.2 Request Reveal**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.3.2.1 | ปุ่มขอเปิดเผยตัวตนเมื่อพร้อมก่อนถึง Threshold |
| FR-1.3.2.2 | อีกฝ่ายต้อง Accept หรือ Decline คำขอ |
| FR-1.3.2.3 | Decline ไม่ส่งผลเสียต่อ Chemistry Score |
| FR-1.3.2.4 | จำกัด Request ได้ 1 ครั้ง/ข้อมูล/วัน |
| FR-1.3.2.5 | มีข้อความอธิบายว่าทำไมถึงขอ Reveal |

**FR-1.3.3 Voice/Video Call Unlock**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.3.3.1 | เปิดใช้งานเมื่อ Chemistry >= 85 |
| FR-1.3.3.2 | ทั้งสองฝ่ายต้อง Consent ก่อนเริ่มโทร |
| FR-1.3.3.3 | Voice Call: ไม่เปิดกล้อง, Video Call: เปิดกล้อง |
| FR-1.3.3.4 | มี Timer แสดงระยะเวลาสนทนา |
| FR-1.3.3.5 | บันทึก Call Duration สำหรับ Analytics (ไม่บันทึกเนื้อหา) |

#### 2.1.4 Phase 4: Paradise Mode (ช่วงเดทจริง)

**FR-1.4.1 Smart Date Planner**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.4.1.1 | AI แนะนำสถานที่/กิจกรรมที่เหมาะสมจาก Profile ทั้งคู่ |
| FR-1.4.1.2 | Filter ตาม: Location, Price Range, Cuisine, Ambiance |
| FR-1.4.1.3 | แสดง Rating และ Reviews จากคู่เดทก่อนหน้า |
| FR-1.4.1.4 | มี Map View แสดงตำแหน่งสถานที่ |
| FR-1.4.1.5 | Suggest วันเวลาที่เหมาะสมจาก Calendar Integration |

**FR-1.4.2 Booking Integration**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.4.2.1 | จองร้านอาหารและรับส่วนลดในแอป |
| FR-1.4.2.2 | Real-time Availability Check |
| FR-1.4.2.3 | Confirmation Code ส่งให้ทั้งสองฝ่าย |
| FR-1.4.2.4 | Reminder Notification ก่อนวันเดท 1 วัน และ 2 ชั่วโมง |
| FR-1.4.2.5 | Cancel/Reschedule ได้ล่วงหน้า 24 ชั่วโมง |

**FR-1.4.3 Split Bill Manager**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.4.3.1 | ตกลงเรื่องค่าใช้จ่ายเดทอย่างโปร่งใสก่อนไปเดท |
| FR-1.4.3.2 | Options: Split Equally, One Pays, Custom Split |
| FR-1.4.3.3 | ทั้งสองฝ่ายต้อง Confirm ก่อน Finalize |
| FR-1.4.3.4 | แสดง Estimated Cost Range ของสถานที่ |
| FR-1.4.3.5 | บันทึก Preference สำหรับเดทครั้งถัดไป |

**FR-1.4.4 Date Vouchers**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.4.4.1 | คูปองส่วนลดจากพาร์ทเนอร์ |
| FR-1.4.4.2 | แสดง Available Vouchers สำหรับสถานที่ที่เลือก |
| FR-1.4.4.3 | Auto-apply Voucher เมื่อจอง |
| FR-1.4.4.4 | Voucher มีวันหมดอายุ |
| FR-1.4.4.5 | บาง Voucher ได้จากการแลก PlayCoin |

**FR-1.4.5 QR Check-in**

| รหัส | ความต้องการ |
|------|-------------|
| FR-1.4.5.1 | สแกน QR Code ที่ร้านเพื่อ Confirm การมาถึง |
| FR-1.4.5.2 | ทั้งสองฝ่ายต้องสแกนภายใน 30 นาทีหลังเวลาจอง |
| FR-1.4.5.3 | ได้รับ PlayCoin Bonus เมื่อ Check-in สำเร็จ |
| FR-1.4.5.4 | ระบบแจ้ง Merchant ว่าลูกค้ามาถึงแล้ว |
| FR-1.4.5.5 | No-show Tracking สำหรับ Analytics |

---

### 2.2 PlayCoin Loyalty System (NEW)

#### 2.2.1 Wallet Management

**FR-2.1.1 User Wallet**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.1.1.1 | ผู้ใช้ทุกคนมี PlayCoin Wallet อัตโนมัติเมื่อสมัคร |
| FR-2.1.1.2 | แสดง Balance, Lifetime Earned, Lifetime Spent |
| FR-2.1.1.3 | Wallet Balance ต้องไม่ติดลบ |
| FR-2.1.1.4 | Transaction History แสดงรายการย้อนหลัง 90 วัน |
| FR-2.1.1.5 | Pending Transactions แยกจาก Confirmed |

**FR-2.1.2 Transaction Processing**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.1.2.1 | Transaction Types: earn, burn, purchase, exchange |
| FR-2.1.2.2 | ทุก Transaction ต้องมี Reference ID และ Source |
| FR-2.1.2.3 | Transaction ต้องเป็น Atomic (All or Nothing) |
| FR-2.1.2.4 | Lock Balance ระหว่างทำ Transaction ป้องกัน Race Condition |
| FR-2.1.2.5 | Audit Trail ครบถ้วนสำหรับทุก Transaction |

#### 2.2.2 Earn Mechanics (Active Mining)

**FR-2.2.1 Daily Check-in**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.2.1.1 | Check-in ได้ 1 ครั้ง/วัน |
| FR-2.2.1.2 | Base Reward: 10 Coins |
| FR-2.2.1.3 | Streak Bonus: +2 Coins ต่อวันต่อเนื่อง (สูงสุด 7 วัน = 24 Coins) |
| FR-2.2.1.4 | Streak Reset เมื่อขาด 1 วัน |
| FR-2.2.1.5 | Check-in Window: 00:00 - 23:59 ตาม Timezone ผู้ใช้ |

**FR-2.2.2 Quest Completion Rewards**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.2.2.1 | Daily Mission: 20-50 Coins ตามระดับความยาก |
| FR-2.2.2.2 | Co-op Games: 10-30 Coins ตามผลลัพธ์ |
| FR-2.2.2.3 | Branded Quest: ตาม Sponsor กำหนด (มักสูงกว่าปกติ) |
| FR-2.2.2.4 | Weekly Challenge: 100-200 Coins |
| FR-2.2.2.5 | Coins ได้รับทันทีเมื่อ Quest สำเร็จ |

**FR-2.2.3 Milestone Achievements**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.2.3.1 | Chat Milestone (7 วันต่อเนื่อง): 100 Coins |
| FR-2.2.3.2 | First Date Milestone: 500 Coins |
| FR-2.2.3.3 | Chemistry 100 Milestone: 200 Coins |
| FR-2.2.3.4 | Profile Complete: 50 Coins |
| FR-2.2.3.5 | Milestone ได้รับครั้งเดียวต่อ Account |

**FR-2.2.4 Offline Sync (QR Scanning)**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.2.4.1 | สแกน QR ที่ร้านพาร์ทเนอร์ได้ 50-200 Coins |
| FR-2.2.4.2 | QR Code Unique ต่อ Venue และมีอายุการใช้งาน |
| FR-2.2.4.3 | Anti-fraud: จำกัดสแกนต่อ User/Venue/Day |
| FR-2.2.4.4 | Location Verification (ต้องอยู่ใกล้ร้าน) |
| FR-2.2.4.5 | Sync Coins ทันทีเมื่อออนไลน์ |

**FR-2.2.5 Referral Program**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.2.5.1 | Referrer ได้ 100 Coins เมื่อ Referee ลงทะเบียนสำเร็จ |
| FR-2.2.5.2 | Referee ได้ 50 Coins Bonus |
| FR-2.2.5.3 | Referral Code Unique ต่อ User |
| FR-2.2.5.4 | จำกัด 10 Referrals/เดือน |
| FR-2.2.5.5 | Anti-fraud: ตรวจสอบ Device และ IP |

**Earn Rate Summary:**

| กิจกรรม | PlayCoin | ความถี่ |
|---------|----------|---------|
| Daily Check-in | 10-24 | วันละครั้ง |
| Daily Quest | 20-50 | วันละ 1-3 |
| Co-op Games | 10-30 | ไม่จำกัด |
| Branded Quest | 50-200 | ตามแคมเปญ |
| Milestones | 50-500 | ครั้งเดียว |
| QR Check-in | 50-200 | ต่อครั้ง |
| Referral | 100 | 10/เดือน |

#### 2.2.3 Burn Mechanics (Utility)

**FR-2.3.1 In-Game Power-ups**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.3.1.1 | Hint Power-up (ช่วยในเกม): 10 Coins |
| FR-2.3.1.2 | Skip Question: 15 Coins |
| FR-2.3.1.3 | Extra Time: 20 Coins |
| FR-2.3.1.4 | Re-match (หาคู่ใหม่): 50 Coins |
| FR-2.3.1.5 | Power-ups มีผลทันทีเมื่อใช้ |

**FR-2.3.2 Avatar Items Store**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.3.2.1 | ไอเทมตกแต่ง Avatar: 50-200 Coins |
| FR-2.3.2.2 | Categories: Hairstyle, Outfit, Accessories, Backgrounds |
| FR-2.3.2.3 | Limited Edition Items (Seasonal) |
| FR-2.3.2.4 | Preview ก่อนซื้อ |
| FR-2.3.2.5 | ไอเทมที่ซื้อแล้วใช้งานได้ตลอด |

**FR-2.3.3 Premium Feature Unlocks**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.3.3.1 | See Who Liked You: 100 Coins |
| FR-2.3.3.2 | Priority Matching: 200 Coins |
| FR-2.3.3.3 | Unlimited Icebreakers: 150 Coins (7 วัน) |
| FR-2.3.3.4 | Read Receipts: 50 Coins (30 วัน) |
| FR-2.3.3.5 | Feature Unlock มีอายุตามที่กำหนด |

**FR-2.3.4 Real-world Rewards Redemption**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.3.4.1 | ส่วนลดร้านอาหาร: 500+ Coins |
| FR-2.3.4.2 | ตั๋วหนัง: 800+ Coins |
| FR-2.3.4.3 | ของที่ระลึก: 1000+ Coins |
| FR-2.3.4.4 | Reward Catalog แสดงของที่แลกได้ |
| FR-2.3.4.5 | Delivery หรือ E-voucher ตามประเภท |

**FR-2.3.5 Partner Point Exchange**

| รหัส | ความต้องการ |
|------|-------------|
| FR-2.3.5.1 | โอน PlayCoin ไป The 1 Card: 100 PlayCoin = 50 Points |
| FR-2.3.5.2 | โอนไป Blue Card: 100 PlayCoin = 40 Points |
| FR-2.3.5.3 | ขั้นต่ำการโอน: 500 PlayCoin |
| FR-2.3.5.4 | ใช้เวลาดำเนินการ 3-5 วันทำการ |
| FR-2.3.5.5 | ต้อง Link Account กับ Partner ก่อน |

**Burn Rate Summary:**

| การใช้งาน | PlayCoin |
|----------|----------|
| In-Game Power-ups | 10-50 |
| Avatar Items | 50-200 |
| Premium Features | 50-200 |
| Real-world Rewards | 500+ |
| Partner Exchange | 500+ (100:40-50 ratio) |

---

### 2.3 B2B Platform (NEW)

#### 2.3.1 Merchant Portal

**FR-3.1.1 Business Account Management**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.1.1.1 | ธุรกิจสมัครเป็น Merchant ผ่าน Online Form |
| FR-3.1.1.2 | Verification Process: ตรวจสอบเอกสารภายใน 3 วันทำการ |
| FR-3.1.1.3 | Account Tiers: Basic, Premium, Enterprise |
| FR-3.1.1.4 | Multiple Users per Merchant Account |
| FR-3.1.1.5 | Role-based Access: Owner, Admin, Staff |

**FR-3.1.2 Campaign Dashboard**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.1.2.1 | Overview: Active Campaigns, Total Spend, ROI |
| FR-3.1.2.2 | Create/Edit/Delete Campaigns |
| FR-3.1.2.3 | Campaign Status: Draft, Pending, Active, Paused, Completed |
| FR-3.1.2.4 | Budget Management และ Spending Alerts |
| FR-3.1.2.5 | Schedule Campaigns ล่วงหน้า |

**FR-3.1.3 Inventory Management**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.1.3.1 | จัดการ Voucher Stock |
| FR-3.1.3.2 | Set Redemption Limits |
| FR-3.1.3.3 | Dynamic Pricing ตามเวลา/วัน |
| FR-3.1.3.4 | Blackout Dates สำหรับวันที่ไม่รับ |
| FR-3.1.3.5 | Low Stock Alerts |

**FR-3.1.4 Booking System for Partners**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.1.4.1 | รับ Booking จากแอป PlayMyDate |
| FR-3.1.4.2 | Confirm/Reject Bookings |
| FR-3.1.4.3 | Manage Table/Slot Availability |
| FR-3.1.4.4 | Integration กับ POS Systems (Phase 2) |
| FR-3.1.4.5 | Walk-in vs Booked Guest Tracking |

**FR-3.1.5 Performance Analytics**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.1.5.1 | CPA (Cost Per Appointment) Tracking |
| FR-3.1.5.2 | CPMI (Cost Per Meaningful Interaction) Tracking |
| FR-3.1.5.3 | Conversion Funnel: Impression → Click → Quest → Booking → Visit |
| FR-3.1.5.4 | Compare Performance Across Campaigns |
| FR-3.1.5.5 | Export Reports (CSV, PDF) |

#### 2.3.2 Smart Campaigner

**FR-3.2.1 Branded Quest Creator**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.2.1.1 | สร้างภารกิจเฉพาะแบรนด์ (e.g., "ไปเดทที่ร้านเรา") |
| FR-3.2.1.2 | เลือก Game Template หรือสร้าง Custom Quest |
| FR-3.2.1.3 | กำหนด Coin Reward และ/หรือ Voucher Reward |
| FR-3.2.1.4 | Set Max Completions และ Budget Cap |
| FR-3.2.1.5 | Preview Quest ก่อน Publish |

**FR-3.2.2 Contextual Ad Integration**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.2.2.1 | โฆษณาในรูปแบบ "ตัวช่วย" ในเกม ไม่ใช่ Banner |
| FR-3.2.2.2 | Native Integration กับ Game Flow |
| FR-3.2.2.3 | Frequency Cap ต่อ User |
| FR-3.2.2.4 | A/B Testing สำหรับ Creative |
| FR-3.2.2.5 | Non-intrusive: ผู้ใช้สามารถ Skip ได้ |

**FR-3.2.3 Voucher Distribution System**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.2.3.1 | แจก Voucher ให้ผู้ใช้ที่ทำภารกิจสำเร็จ |
| FR-3.2.3.2 | Voucher Types: Discount %, Fixed Amount, Freebie |
| FR-3.2.3.3 | Voucher Expiration และ Terms |
| FR-3.2.3.4 | Unique Code Generation |
| FR-3.2.3.5 | Track Redemption Rate |

**FR-3.2.4 A/B Testing Framework**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.2.4.1 | ทดสอบ Quest Variations ก่อน Full Launch |
| FR-3.2.4.2 | Split Traffic 50/50 หรือ Custom Ratio |
| FR-3.2.4.3 | Statistical Significance Calculator |
| FR-3.2.4.4 | Auto-select Winner เมื่อถึง Threshold |
| FR-3.2.4.5 | Compare Metrics: Completion Rate, Time Spent, Conversion |

**FR-3.2.5 Target Audience Selection**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.2.5.1 | Filter by Demographics: Age, Gender, Location |
| FR-3.2.5.2 | Filter by Behavioral Persona: Caregiver, Strategist, Explorer |
| FR-3.2.5.3 | Filter by Interests และ Playing Style |
| FR-3.2.5.4 | Lookalike Audience จาก Past Converters |
| FR-3.2.5.5 | Estimated Reach Preview |

#### 2.3.3 Insight Dashboard

**FR-3.3.1 Behavioral Segmentation Analytics**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.3.1.1 | แบ่งกลุ่มตาม Play Patterns (Caregiver, Strategist, Explorer, Achiever) |
| FR-3.3.1.2 | Segment Size และ Growth Trends |
| FR-3.3.1.3 | Cross-segment Analysis |
| FR-3.3.1.4 | Custom Segment Builder |
| FR-3.3.1.5 | Segment Profile Cards |

**FR-3.3.2 Consumer Trend Reports**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.3.2.1 | รายงานเทรนด์รายไตรมาส |
| FR-3.3.2.2 | Topics: Dating Preferences, Spending Habits, Activity Trends |
| FR-3.3.2.3 | Benchmark Against Industry |
| FR-3.3.2.4 | Downloadable Report (PDF) |
| FR-3.3.2.5 | Custom Report Builder (Enterprise Tier) |

**FR-3.3.3 Predictive Analytics**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.3.3.1 | คาดการณ์พฤติกรรมการใช้จ่าย |
| FR-3.3.3.2 | Churn Prediction สำหรับ Segments |
| FR-3.3.3.3 | Optimal Campaign Timing |
| FR-3.3.3.4 | ROI Forecasting |
| FR-3.3.3.5 | Confidence Intervals และ Assumptions |

**FR-3.3.4 First-Party Data Service**

| รหัส | ความต้องการ |
|------|-------------|
| FR-3.3.4.1 | ข้อมูลว่าคนโสดกลุ่มเป้าหมายชอบอะไร เวลาไหน |
| FR-3.3.4.2 | Aggregated และ Anonymized Data Only |
| FR-3.3.4.3 | Minimum Sample Size Requirements |
| FR-3.3.4.4 | Data Freshness Indicators |
| FR-3.3.4.5 | API Access สำหรับ Enterprise Tier |

---

### 2.4 Authentication & Authorization

**FR-4.1 User Authentication (B2C)**

| รหัส | ความต้องการ |
|------|-------------|
| FR-4.1.1 | Email/Password Registration และ Login |
| FR-4.1.2 | Session-based Authentication (Lucia) |
| FR-4.1.3 | Password Hashing: Argon2id |
| FR-4.1.4 | Session Expiration: 30 วัน |
| FR-4.1.5 | Password Reset via Email |

**FR-4.2 Merchant Authentication (B2B)**

| รหัส | ความต้องการ |
|------|-------------|
| FR-4.2.1 | Email/Password Login สำหรับ Merchant Users |
| FR-4.2.2 | Separate Session Store จาก B2C |
| FR-4.2.3 | Multi-factor Authentication (MFA) - Optional |
| FR-4.2.4 | API Key Generation สำหรับ Integrations |
| FR-4.2.5 | IP Whitelist สำหรับ API Access |

**FR-4.3 Role-based Access Control**

| รหัส | ความต้องการ |
|------|-------------|
| FR-4.3.1 | B2C Roles: Free, Premium, Premium Plus |
| FR-4.3.2 | B2B Roles: Owner, Admin, Staff |
| FR-4.3.3 | Permission Matrix per Role |
| FR-4.3.4 | Custom Permissions สำหรับ Enterprise |
| FR-4.3.5 | Audit Log สำหรับ Permission Changes |

---

### 2.5 Communication System

**FR-5.1 Real-time Messaging**

| รหัส | ความต้องการ |
|------|-------------|
| FR-5.1.1 | Text Messages ระหว่างผู้ใช้ที่ Match กัน |
| FR-5.1.2 | Message Polling ทุก 3 วินาที |
| FR-5.1.3 | Message History Pagination |
| FR-5.1.4 | Read Receipts (Premium Feature) |
| FR-5.1.5 | Message Search (Phase 2) |

**FR-5.2 Typing Indicators**

| รหัส | ความต้องการ |
|------|-------------|
| FR-5.2.1 | แสดง "กำลังพิมพ์..." เมื่ออีกฝ่ายพิมพ์ |
| FR-5.2.2 | Auto-clear หลังหยุดพิมพ์ 5 วินาที |
| FR-5.2.3 | Debounce Updates ทุก 1 วินาที |

**FR-5.3 Voice/Video Call**

| รหัส | ความต้องการ |
|------|-------------|
| FR-5.3.1 | ใช้งานได้เมื่อ Chemistry >= 85 |
| FR-5.3.2 | P2P Connection ผ่าน WebRTC |
| FR-5.3.3 | Fallback TURN Server |
| FR-5.3.4 | Call Quality Indicators |
| FR-5.3.5 | End Call จากฝั่งใดก็ได้ |

**FR-5.4 Push Notifications**

| รหัส | ความต้องการ |
|------|-------------|
| FR-5.4.1 | New Match Notification |
| FR-5.4.2 | New Message Notification |
| FR-5.4.3 | Mission Available Notification |
| FR-5.4.4 | Date Reminder Notification |
| FR-5.4.5 | Notification Preferences (On/Off per Type) |

---

### 2.6 Subscription & Payment System

**FR-6.1 Subscription Management**

| รหัส | ความต้องการ |
|------|-------------|
| FR-6.1.1 | Tiers: Free, Premium (฿299/เดือน), Premium Plus (฿499/เดือน) |
| FR-6.1.2 | Annual Discount: 20% |
| FR-6.1.3 | Auto-renewal |
| FR-6.1.4 | Cancel Anytime (ใช้ได้ถึงสิ้นรอบ) |
| FR-6.1.5 | Grace Period: 3 วันหลังหมดอายุ |

**FR-6.2 PlayCoin Purchase**

| รหัส | ความต้องการ |
|------|-------------|
| FR-6.2.1 | Packages: 100 (฿35), 500 (฿149), 1000 (฿249) |
| FR-6.2.2 | Bonus Coins สำหรับ Larger Packages |
| FR-6.2.3 | In-App Purchase via App Store/Play Store |
| FR-6.2.4 | Direct Purchase via Payment Gateway |
| FR-6.2.5 | Purchase History |

**FR-6.3 B2B Billing**

| รหัส | ความต้องการ |
|------|-------------|
| FR-6.3.1 | CPA Billing: ค่าธรรมเนียมต่อ Appointment |
| FR-6.3.2 | CPMI Billing: ค่าธรรมเนียมต่อ Meaningful Interaction |
| FR-6.3.3 | Data Subscription: รายเดือน/รายปี |
| FR-6.3.4 | Invoice Generation รายเดือน |
| FR-6.3.5 | Multiple Payment Methods: Bank Transfer, Credit Card |

**FR-6.4 Payment Processing**

| รหัส | ความต้องการ |
|------|-------------|
| FR-6.4.1 | Payment Gateway Integration (Stripe/Omise) |
| FR-6.4.2 | PCI DSS Compliance |
| FR-6.4.3 | Refund Processing |
| FR-6.4.4 | Payment Failure Retry |
| FR-6.4.5 | Receipt Generation |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| รหัส | ความต้องการ | Target |
|------|-------------|--------|
| NFR-1.1 | API Response Time (95th percentile) | < 200ms |
| NFR-1.2 | Real-time Message Delivery | < 100ms |
| NFR-1.3 | Page Load Time (First Contentful Paint) | < 1.5s |
| NFR-1.4 | Database Query Time (avg) | < 50ms |
| NFR-1.5 | Concurrent Users Support | 10,000+ |
| NFR-1.6 | PlayCoin Transaction Processing | < 500ms |
| NFR-1.7 | Image/Media Loading | < 2s |

### 3.2 Security

| รหัส | ความต้องการ |
|------|-------------|
| NFR-2.1 | Data Encryption at Rest (AES-256) |
| NFR-2.2 | Data Encryption in Transit (TLS 1.3) |
| NFR-2.3 | Password Hashing (Argon2id) |
| NFR-2.4 | PDPA Compliance (Thai Personal Data Protection Act) |
| NFR-2.5 | PlayCoin Anti-fraud: Rate Limiting, Device Fingerprinting |
| NFR-2.6 | B2B Data Isolation (Row-level Security) |
| NFR-2.7 | Audit Logging สำหรับ Sensitive Operations |
| NFR-2.8 | OWASP Top 10 Protection |
| NFR-2.9 | SQL Injection Prevention (Parameterized Queries) |
| NFR-2.10 | XSS Prevention (Content Security Policy) |

### 3.3 Scalability

| รหัส | ความต้องการ |
|------|-------------|
| NFR-3.1 | Vercel Auto-scaling (Serverless Functions) |
| NFR-3.2 | Neon Connection Pooling (Serverless Driver) |
| NFR-3.3 | Vercel Edge Caching สำหรับ Static Assets |
| NFR-3.4 | ISR (Incremental Static Regeneration) สำหรับ Semi-static Pages |
| NFR-3.5 | API Route Caching ด้วย Vercel KV (Phase 2) |

### 3.4 Availability

| รหัส | ความต้องการ | Target |
|------|-------------|--------|
| NFR-4.1 | System Uptime | 99.9% |
| NFR-4.2 | Planned Maintenance Window | < 2 hours/month |
| NFR-4.3 | Recovery Time Objective (RTO) | < 1 hour |
| NFR-4.4 | Recovery Point Objective (RPO) | < 15 minutes |
| NFR-4.5 | Database Backup | Daily + Transaction Logs |
| NFR-4.6 | Multi-region Failover | Phase 2 |

### 3.5 Constraints

**Business Constraints:**
- ไม่รับประกันผลลัพธ์ความสัมพันธ์หรือการแต่งงาน
- ไม่เน้นการปัดหรือดูโปรไฟล์จำนวนมากแบบไม่จำกัด
- PlayCoin ไม่สามารถแลกเป็นเงินจริงได้โดยตรง

**Technical Constraints:**
- ใช้ Next.js App Router เป็น Full-stack Framework
- ใช้ PostgreSQL (Neon Serverless) เป็น Database หลัก
- Hosting บน Vercel (Serverless Functions)
- Real-time Features ใช้ Polling (WebSocket ใน Phase 2)
- Media Storage ใช้ Vercel Blob
- ไม่ใช้ External Cache (Redis) ใน Phase 1

**Regulatory Constraints:**
- ต้องปฏิบัติตาม PDPA
- ต้องมี Terms of Service และ Privacy Policy ที่ชัดเจน
- ต้องมี Content Moderation Policy

---

## 4. High-Level Components

### 4.1 Frontend Components

#### 4.1.1 B2C Application Modules

| Module | รายละเอียด | หน้าหลัก |
|--------|------------|----------|
| **Auth Module** | การลงทะเบียนและเข้าสู่ระบบ | Login, Register, Forgot Password |
| **Profile Module** | การจัดการโปรไฟล์และ Avatar | Profile Edit, Avatar Builder, Voice Recorder |
| **Matching Module** | การจับคู่และจัดการ Matches | Discover, Matches List, Match Detail |
| **Activity Module** | เกมและภารกิจ | Daily Missions, Game Player, Quest Details |
| **Chat Module** | การสื่อสาร | Chat Room, Call Interface |
| **Paradise Module** | การวางแผนเดท | Venue Search, Booking, Date Manager |
| **Wallet Module** | จัดการ PlayCoin | Balance, Transactions, Rewards Store |
| **Settings Module** | การตั้งค่า | Preferences, Notifications, Subscription |

#### 4.1.2 B2B Portal Modules

| Module | รายละเอียด | หน้าหลัก |
|--------|------------|----------|
| **B2B Auth Module** | การเข้าสู่ระบบสำหรับ Merchant | Login, Password Reset, MFA |
| **Dashboard Module** | ภาพรวมและสรุป | Overview, Quick Actions |
| **Campaign Module** | จัดการแคมเปญ | Campaign List, Editor, A/B Test |
| **Quest Module** | สร้างและจัดการ Branded Quests | Quest Builder, Templates |
| **Venue Module** | จัดการสถานที่ | Venue List, Availability, Pricing |
| **Booking Module** | จัดการการจอง | Booking List, Calendar View |
| **Analytics Module** | รายงานและวิเคราะห์ | Metrics, Reports, Export |
| **Settings Module** | การตั้งค่าบัญชี | Profile, Users, API Keys, Billing |

### 4.2 API Route Modules (`/lib/services`)

Business logic จัดเป็น modules ใน `/lib/services` เรียกใช้จาก API Routes:

#### 4.2.1 Core Modules

| Module | File | ความรับผิดชอบ |
|--------|------|---------------|
| **User** | `/lib/services/user.ts` | จัดการผู้ใช้, โปรไฟล์, Preferences |
| **Auth** | `/lib/auth.ts` | Authentication, Sessions, Password Reset |
| **Matching** | `/lib/services/matching.ts` | การจับคู่, Compatibility, Chemistry |
| **Activity** | `/lib/services/activity.ts` | Games, Missions, Progress |
| **Communication** | `/lib/services/communication.ts` | Messages, Typing Status |
| **Intimacy** | `/lib/services/intimacy.ts` | Chemistry Meter, Unlocks |

#### 4.2.2 Loyalty Modules (NEW)

| Module | File | ความรับผิดชอบ |
|--------|------|---------------|
| **PlayCoin** | `/lib/services/playcoin.ts` | Wallet, Transactions |
| **Reward** | `/lib/services/reward.ts` | Catalog, Redemption |
| **Checkin** | `/lib/services/checkin.ts` | Daily Check-in, Streaks |

#### 4.2.3 B2B Modules (NEW)

| Module | File | ความรับผิดชอบ |
|--------|------|---------------|
| **Merchant** | `/lib/services/merchant.ts` | Accounts, Users, API Keys |
| **Campaign** | `/lib/services/campaign.ts` | CRUD, Scheduling, Budget |
| **Quest** | `/lib/services/quest.ts` | Branded Quests, Completions |
| **Analytics** | `/lib/services/analytics.ts` | Metrics, Reports |
| **Venue** | `/lib/services/venue.ts` | Venue Management |
| **Booking** | `/lib/services/booking.ts` | Reservations, Confirmations |

### 4.3 External Services

| Service | Provider | Purpose | Phase |
|---------|----------|---------|-------|
| **Payment Gateway** | Stripe | การชำระเงิน Subscription และ PlayCoin | Phase 1 |
| **Email** | Resend / SendGrid | อีเมล Transactional | Phase 1 |
| **Maps API** | Google Maps | ค้นหาและแนะนำสถานที่ | Phase 2 |
| **Video/Voice** | Daily.co | Voice และ Video Call | Phase 2 |
| **Push Notifications** | Web Push API | แจ้งเตือน | Phase 2 |
| **Partner APIs** | The 1, Blue Card | Point Exchange | Phase 2 |

**หมายเหตุ:** Vercel จัดการ CDN และ Edge Caching ให้อัตโนมัติ

### 4.4 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                 Vercel Infrastructure                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Users / Merchants]                                         │
│         │                                                    │
│         ↓                                                    │
│  [Vercel Edge Network] ─── CDN, SSL, Rate Limiting           │
│         │                                                    │
│         ↓                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js App (Serverless)                              │ │
│  │  ├── Static Pages (Edge Cached)                        │ │
│  │  ├── Server Components (Streaming SSR)                 │ │
│  │  └── API Routes (Serverless Functions)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│         │                                                    │
│    ┌────┴────────────────┐                                  │
│    ↓                     ↓                                   │
│  [Neon PostgreSQL]  [Vercel Blob]                           │
│  (Serverless)       (Media Storage)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Vercel Features ที่ใช้:**
- **Edge Network** - Global CDN, SSL Termination
- **Serverless Functions** - Auto-scaling API Routes
- **Edge Middleware** - Auth & Rate Limiting
- **Vercel Blob** - Object Storage สำหรับ Media
- **Vercel KV** - Key-Value Cache (Phase 2)

---

## 5. Data Overview

### 5.1 Core User Data

**Table: users**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| email | VARCHAR(255) | อีเมลสำหรับ Login (Unique) |
| password_hash | TEXT | Argon2id Hashed Password |
| display_name | VARCHAR(100) | ชื่อที่แสดงในแอป |
| bio | TEXT | คำอธิบายตัวเอง |
| playing_style | VARCHAR(50)[] | สไตล์การเล่น |
| interests | VARCHAR(100)[] | ความสนใจ |
| avatar_config | JSONB | การตั้งค่า Avatar |
| voice_note_url | TEXT | URL ของ Voice Note |
| real_name | VARCHAR(100) | ชื่อจริง (ปลดล็อกทีหลัง) |
| photo_url | TEXT | รูปภาพจริง (ปลดล็อกทีหลัง) |
| occupation | VARCHAR(100) | อาชีพ (ปลดล็อกทีหลัง) |
| phone | VARCHAR(20) | เบอร์โทร (ปลดล็อกทีหลัง) |
| behavioral_persona | VARCHAR(50) | Persona จาก Quiz |
| subscription_tier | VARCHAR(20) | ระดับสมาชิก |
| subscription_expires_at | TIMESTAMP | วันหมดอายุสมาชิก |
| referral_code | VARCHAR(50) | รหัสเชิญเพื่อน |
| referred_by_user_id | UUID | FK → users |
| created_at | TIMESTAMP | วันที่สมัคร |
| updated_at | TIMESTAMP | วันที่แก้ไขล่าสุด |

### 5.2 Matching & Relationship Data

**Table: matches**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user1_id | UUID | FK → users |
| user2_id | UUID | FK → users |
| compatibility_score | INTEGER | คะแนนความเข้ากัน (0-100) |
| chemistry_score | INTEGER | Chemistry Meter (0-100) |
| mission_streak | INTEGER | จำนวนวันทำ Mission ต่อเนื่อง |
| status | VARCHAR(20) | active, unmatched, blocked |
| paradise_mode_unlocked | BOOLEAN | ปลดล็อก Paradise Mode หรือยัง |
| paradise_mode_unlocked_at | TIMESTAMP | วันที่ปลดล็อก |
| last_activity_at | TIMESTAMP | กิจกรรมล่าสุด |
| created_at | TIMESTAMP | วันที่ Match |
| updated_at | TIMESTAMP | วันที่อัพเดทล่าสุด |

### 5.3 Activity & Mission Data

**Table: activities**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | ชื่อกิจกรรม |
| type | VARCHAR(50) | puzzle, trivia, creative, communication |
| description | TEXT | คำอธิบาย |
| instructions | TEXT | วิธีเล่น |
| intimacy_points | INTEGER | คะแนนที่ได้เมื่อจบ |
| coin_reward | INTEGER | PlayCoin ที่ได้ |
| difficulty_level | INTEGER | ระดับความยาก (1-3) |
| estimated_duration_minutes | INTEGER | เวลาโดยประมาณ |
| is_branded | BOOLEAN | เป็น Branded Quest หรือไม่ |
| sponsor_merchant_id | UUID | FK → merchants (ถ้ามี) |
| config | JSONB | การตั้งค่าเฉพาะเกม |
| is_active | BOOLEAN | เปิดใช้งานหรือไม่ |
| created_at | TIMESTAMP | วันที่สร้าง |

**Table: activity_instances**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| match_id | UUID | FK → matches |
| activity_id | UUID | FK → activities |
| status | VARCHAR(20) | pending, in_progress, completed, expired |
| progress | JSONB | ความคืบหน้า |
| result | JSONB | ผลลัพธ์ |
| coins_earned | INTEGER | PlayCoin ที่ได้รับ |
| started_at | TIMESTAMP | เวลาเริ่ม |
| completed_at | TIMESTAMP | เวลาจบ |
| expires_at | TIMESTAMP | เวลาหมดอายุ |
| created_at | TIMESTAMP | วันที่สร้าง |

### 5.4 Communication Data

**Table: messages**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| match_id | UUID | FK → matches |
| sender_id | UUID | FK → users |
| content | TEXT | เนื้อหาข้อความ |
| message_type | VARCHAR(20) | text, system, icebreaker |
| is_read | BOOLEAN | อ่านแล้วหรือยัง |
| read_at | TIMESTAMP | เวลาที่อ่าน |
| created_at | TIMESTAMP | เวลาส่ง |

**Table: typing_status**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| match_id | UUID | FK → matches |
| user_id | UUID | FK → users |
| is_typing | BOOLEAN | กำลังพิมพ์หรือไม่ |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

### 5.5 Intimacy & Unlock Data

**Table: intimacy_scores**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| match_id | UUID | FK → matches (Unique) |
| score | INTEGER | คะแนนความสนิท |
| unlocks | VARCHAR(50)[] | รายการที่ปลดล็อกแล้ว |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

**Table: unlock_history**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| match_id | UUID | FK → matches |
| unlock_type | VARCHAR(50) | real_name, photo, occupation, call |
| unlocked_by_user_id | UUID | FK → users |
| requested_at | TIMESTAMP | เวลาที่ขอ |
| unlocked_at | TIMESTAMP | เวลาที่ปลดล็อก |

### 5.6 Date Planning Data

**Table: date_venues**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| merchant_id | UUID | FK → merchants |
| name | VARCHAR(255) | ชื่อสถานที่ |
| venue_type | VARCHAR(50) | restaurant, cafe, activity, movie |
| address | TEXT | ที่อยู่ |
| location_lat | DECIMAL(10,8) | ละติจูด |
| location_lng | DECIMAL(11,8) | ลองจิจูด |
| price_range | INTEGER | 1-4 (฿ - ฿฿฿฿) |
| cuisine_type | VARCHAR(50) | ประเภทอาหาร |
| ambiance_tags | JSONB | บรรยากาศ ['romantic', 'casual'] |
| opening_hours | JSONB | เวลาเปิด-ปิด |
| booking_enabled | BOOLEAN | รับจองผ่านแอปหรือไม่ |
| photos | JSONB | รูปภาพ |
| rating | DECIMAL(3,2) | คะแนนเฉลี่ย |
| is_active | BOOLEAN | เปิดใช้งานหรือไม่ |
| created_at | TIMESTAMP | วันที่สร้าง |

**Table: date_bookings**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| match_id | UUID | FK → matches |
| venue_id | UUID | FK → date_venues |
| initiated_by_user_id | UUID | FK → users |
| booking_date | DATE | วันที่จอง |
| booking_time | TIME | เวลาที่จอง |
| party_size | INTEGER | จำนวนคน |
| status | VARCHAR(20) | pending, confirmed, cancelled, completed, no_show |
| special_requests | TEXT | คำขอพิเศษ |
| confirmation_code | VARCHAR(50) | รหัสยืนยัน |
| voucher_applied_id | UUID | FK → user_rewards |
| split_bill_preference | VARCHAR(20) | equal, one_pays, custom |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

**Table: qr_checkins**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| venue_id | UUID | FK → date_venues |
| booking_id | UUID | FK → date_bookings (optional) |
| qr_code | VARCHAR(255) | QR Code ที่สแกน |
| coins_earned | INTEGER | PlayCoin ที่ได้รับ |
| checked_in_at | TIMESTAMP | เวลา Check-in |

### 5.7 PlayCoin & Transaction Data (NEW)

**Table: playcoin_wallets**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users (Unique) |
| balance | INTEGER | ยอดคงเหลือ |
| lifetime_earned | INTEGER | รวมที่เคยได้รับ |
| lifetime_spent | INTEGER | รวมที่เคยใช้ |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

**Table: playcoin_transactions**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| wallet_id | UUID | FK → playcoin_wallets |
| type | VARCHAR(20) | earn, burn, purchase, exchange |
| amount | INTEGER | จำนวน (บวก=ได้รับ, ลบ=ใช้) |
| balance_after | INTEGER | ยอดหลังทำรายการ |
| source | VARCHAR(50) | daily_checkin, quest, purchase, reward, exchange |
| reference_id | UUID | ID อ้างอิง (quest_id, reward_id, etc.) |
| metadata | JSONB | ข้อมูลเพิ่มเติม |
| created_at | TIMESTAMP | เวลาทำรายการ |

**Table: daily_checkins**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| checkin_date | DATE | วันที่ Check-in |
| streak_count | INTEGER | จำนวนวันต่อเนื่อง |
| coins_earned | INTEGER | PlayCoin ที่ได้ |
| created_at | TIMESTAMP | เวลา Check-in |

**Table: rewards**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(255) | ชื่อ Reward |
| description | TEXT | คำอธิบาย |
| type | VARCHAR(50) | powerup, avatar_item, voucher, partner_exchange |
| coin_cost | INTEGER | ราคา PlayCoin |
| stock_quantity | INTEGER | จำนวนคงเหลือ (NULL = ไม่จำกัด) |
| partner_id | UUID | FK → merchants (optional) |
| is_active | BOOLEAN | เปิดใช้งานหรือไม่ |
| metadata | JSONB | ข้อมูลเพิ่มเติม |
| created_at | TIMESTAMP | วันที่สร้าง |

**Table: user_rewards**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users |
| reward_id | UUID | FK → rewards |
| transaction_id | UUID | FK → playcoin_transactions |
| status | VARCHAR(20) | redeemed, used, expired |
| redeemed_at | TIMESTAMP | เวลาแลก |
| used_at | TIMESTAMP | เวลาใช้ |
| expires_at | TIMESTAMP | วันหมดอายุ |

### 5.8 B2B Merchant Data (NEW)

**Table: merchants**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(255) | ชื่อธุรกิจ |
| business_type | VARCHAR(50) | restaurant, cafe, brand, venue |
| contact_email | VARCHAR(255) | อีเมลติดต่อ |
| contact_phone | VARCHAR(50) | เบอร์โทร |
| address | TEXT | ที่อยู่ |
| logo_url | TEXT | โลโก้ |
| description | TEXT | คำอธิบายธุรกิจ |
| status | VARCHAR(20) | pending, active, suspended |
| tier | VARCHAR(20) | basic, premium, enterprise |
| api_key | VARCHAR(255) | API Key (Unique) |
| metadata | JSONB | ข้อมูลเพิ่มเติม |
| created_at | TIMESTAMP | วันที่สมัคร |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

**Table: merchant_users**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| merchant_id | UUID | FK → merchants |
| email | VARCHAR(255) | อีเมล (Unique) |
| password_hash | TEXT | Password Hash |
| display_name | VARCHAR(100) | ชื่อแสดง |
| role | VARCHAR(20) | owner, admin, staff |
| permissions | JSONB | สิทธิ์เฉพาะ |
| is_active | BOOLEAN | ใช้งานได้หรือไม่ |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

### 5.9 Campaign & Quest Data (NEW)

**Table: campaigns**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| merchant_id | UUID | FK → merchants |
| name | VARCHAR(255) | ชื่อแคมเปญ |
| type | VARCHAR(50) | branded_quest, voucher, promotion |
| description | TEXT | คำอธิบาย |
| budget | DECIMAL(10,2) | งบประมาณ |
| spent | DECIMAL(10,2) | ใช้ไปแล้ว |
| cpa_rate | DECIMAL(10,2) | Cost per Appointment |
| cpmi_rate | DECIMAL(10,2) | Cost per Meaningful Interaction |
| target_audience | JSONB | กลุ่มเป้าหมาย |
| start_date | TIMESTAMP | วันเริ่ม |
| end_date | TIMESTAMP | วันสิ้นสุด |
| status | VARCHAR(20) | draft, pending, active, paused, completed |
| metrics | JSONB | ผลลัพธ์ |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

**Table: branded_quests**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| campaign_id | UUID | FK → campaigns |
| activity_id | UUID | FK → activities |
| name | VARCHAR(255) | ชื่อ Quest |
| description | TEXT | คำอธิบาย |
| instructions | TEXT | วิธีเล่น |
| coin_reward | INTEGER | PlayCoin ที่ให้ |
| voucher_reward_id | UUID | FK → rewards |
| max_completions | INTEGER | จำกัดจำนวน |
| completion_count | INTEGER | ทำสำเร็จแล้วกี่ครั้ง |
| is_active | BOOLEAN | เปิดใช้งานหรือไม่ |
| created_at | TIMESTAMP | วันที่สร้าง |

**Table: quest_completions**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| branded_quest_id | UUID | FK → branded_quests |
| user_id | UUID | FK → users |
| match_id | UUID | FK → matches |
| completed_at | TIMESTAMP | เวลาที่ทำสำเร็จ |
| reward_granted | BOOLEAN | ให้รางวัลแล้วหรือยัง |

### 5.10 Analytics & Behavioral Data (NEW)

**Table: user_behavioral_profiles**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK → users (Unique) |
| persona_type | VARCHAR(50) | caregiver, strategist, explorer, achiever |
| play_patterns | JSONB | รูปแบบการเล่น |
| preference_scores | JSONB | คะแนน Preferences |
| activity_history_summary | JSONB | สรุปประวัติกิจกรรม |
| date_preferences | JSONB | ความชอบในการเดท |
| spending_patterns | JSONB | รูปแบบการใช้จ่าย |
| last_analyzed_at | TIMESTAMP | วิเคราะห์ล่าสุด |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | อัพเดทล่าสุด |

**Table: aggregated_insights**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| report_type | VARCHAR(50) | trend, segment, behavior |
| period_start | DATE | เริ่มช่วงเวลา |
| period_end | DATE | สิ้นสุดช่วงเวลา |
| segment_criteria | JSONB | เงื่อนไขการแบ่งกลุ่ม |
| metrics | JSONB | ผลลัพธ์การวิเคราะห์ |
| sample_size | INTEGER | จำนวน Sample |
| created_at | TIMESTAMP | วันที่สร้าง |

**Table: campaign_events**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| campaign_id | UUID | FK → campaigns |
| event_type | VARCHAR(50) | impression, click, quest_start, quest_complete, appointment, conversion |
| user_id | UUID | FK → users |
| match_id | UUID | FK → matches |
| metadata | JSONB | ข้อมูลเพิ่มเติม |
| created_at | TIMESTAMP | เวลาเกิด Event |

---

## 6. API Specification Overview

### 6.1 B2C API Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | ลงทะเบียนผู้ใช้ใหม่ |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/session` | ตรวจสอบ Session |
| POST | `/api/auth/forgot-password` | ขอรีเซ็ตรหัสผ่าน |
| POST | `/api/auth/reset-password` | รีเซ็ตรหัสผ่าน |

#### Users & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | ดูโปรไฟล์ตัวเอง |
| PUT | `/api/users/me` | แก้ไขโปรไฟล์ |
| POST | `/api/users/avatar` | บันทึก Avatar Config |
| POST | `/api/users/voice-note` | อัพโหลด Voice Note |
| GET | `/api/users/[id]` | ดูโปรไฟล์ผู้อื่น (ตาม Unlock Level) |

#### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | รายการ Match ทั้งหมด |
| POST | `/api/matches/find` | ค้นหา Match ใหม่ |
| GET | `/api/matches/[id]` | ดูรายละเอียด Match |
| POST | `/api/matches/unmatch` | ยกเลิก Match |
| GET | `/api/matches/[id]/chemistry` | ดู Chemistry Meter |

#### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages?matchId=X` | ดูข้อความในห้องแชท |
| POST | `/api/messages` | ส่งข้อความ |
| POST | `/api/typing` | ส่งสถานะ Typing |

#### Activities & Missions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | รายการกิจกรรมที่เปิดใช้งาน |
| GET | `/api/activities/daily-missions?matchId=X` | Daily Missions สำหรับคู่ Match |
| POST | `/api/activities/start` | เริ่มกิจกรรม |
| POST | `/api/activities/complete` | จบกิจกรรม |
| GET | `/api/activities/instances?matchId=X` | ประวัติกิจกรรมของคู่ |

#### Intimacy & Unlocks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/intimacy?matchId=X` | ดูคะแนน Intimacy และ Available Unlocks |
| POST | `/api/intimacy/unlock` | ปลดล็อกข้อมูล |
| POST | `/api/intimacy/request-reveal` | ขอเปิดเผยข้อมูลก่อนถึง Threshold |

#### PlayCoin (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playcoin/wallet` | ดูยอด Wallet |
| GET | `/api/playcoin/transactions` | ประวัติ Transaction |
| POST | `/api/playcoin/checkin` | Daily Check-in |
| GET | `/api/playcoin/rewards` | Reward Catalog |
| POST | `/api/playcoin/redeem` | แลก Reward |
| GET | `/api/playcoin/user-rewards` | รายการ Reward ที่แลกไว้ |
| POST | `/api/playcoin/exchange` | แลกเป็น Partner Points |

#### Date Planning (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dates/venues` | ค้นหาสถานที่เดท |
| GET | `/api/dates/venues/[id]` | รายละเอียดสถานที่ |
| GET | `/api/dates/recommendations?matchId=X` | แนะนำสถานที่สำหรับคู่ |
| POST | `/api/dates/bookings` | จองสถานที่ |
| GET | `/api/dates/bookings` | รายการจองของฉัน |
| GET | `/api/dates/bookings/[id]` | รายละเอียดการจอง |
| PUT | `/api/dates/bookings/[id]` | แก้ไขการจอง |
| DELETE | `/api/dates/bookings/[id]` | ยกเลิกการจอง |
| POST | `/api/dates/checkin` | QR Check-in ที่ร้าน |

#### Subscription

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | ดูสถานะสมาชิก |
| POST | `/api/subscription/upgrade` | อัพเกรดสมาชิก |
| POST | `/api/subscription/cancel` | ยกเลิกสมาชิก |

### 6.2 B2B API Endpoints (NEW)

#### B2B Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/b2b/auth/login` | Merchant Login |
| POST | `/api/b2b/auth/logout` | Merchant Logout |
| GET | `/api/b2b/auth/session` | ตรวจสอบ Session |
| POST | `/api/b2b/auth/api-key` | สร้าง API Key ใหม่ |

#### Merchant Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/merchant` | ดูข้อมูล Merchant |
| PUT | `/api/b2b/merchant` | แก้ไขข้อมูล Merchant |
| GET | `/api/b2b/merchant/users` | รายการ Users ของ Merchant |
| POST | `/api/b2b/merchant/users` | เพิ่ม User |
| PUT | `/api/b2b/merchant/users/[id]` | แก้ไข User |
| DELETE | `/api/b2b/merchant/users/[id]` | ลบ User |

#### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/campaigns` | รายการ Campaign |
| POST | `/api/b2b/campaigns` | สร้าง Campaign |
| GET | `/api/b2b/campaigns/[id]` | รายละเอียด Campaign |
| PUT | `/api/b2b/campaigns/[id]` | แก้ไข Campaign |
| DELETE | `/api/b2b/campaigns/[id]` | ลบ Campaign |
| POST | `/api/b2b/campaigns/[id]/activate` | เปิดใช้งาน Campaign |
| POST | `/api/b2b/campaigns/[id]/pause` | หยุด Campaign ชั่วคราว |

#### Branded Quests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/quests` | รายการ Branded Quests |
| POST | `/api/b2b/quests` | สร้าง Quest |
| GET | `/api/b2b/quests/[id]` | รายละเอียด Quest |
| PUT | `/api/b2b/quests/[id]` | แก้ไข Quest |
| DELETE | `/api/b2b/quests/[id]` | ลบ Quest |
| GET | `/api/b2b/quests/[id]/completions` | รายการคนที่ทำ Quest สำเร็จ |

#### Venues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/venues` | รายการสถานที่ของ Merchant |
| POST | `/api/b2b/venues` | เพิ่มสถานที่ |
| GET | `/api/b2b/venues/[id]` | รายละเอียดสถานที่ |
| PUT | `/api/b2b/venues/[id]` | แก้ไขสถานที่ |
| DELETE | `/api/b2b/venues/[id]` | ลบสถานที่ |
| PUT | `/api/b2b/venues/[id]/availability` | อัพเดท Availability |

#### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/bookings` | รายการ Booking ที่เข้ามา |
| GET | `/api/b2b/bookings/[id]` | รายละเอียด Booking |
| PUT | `/api/b2b/bookings/[id]` | Confirm/Reject Booking |
| POST | `/api/b2b/bookings/[id]/checkin` | Manual Check-in |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/analytics/overview` | Dashboard Overview |
| GET | `/api/b2b/analytics/conversions` | Conversion Metrics |
| GET | `/api/b2b/analytics/audience` | Audience Insights |
| GET | `/api/b2b/analytics/campaigns/[id]` | Campaign Performance |
| POST | `/api/b2b/analytics/reports` | Generate Custom Report |
| GET | `/api/b2b/analytics/reports/[id]` | Download Report |

#### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/b2b/billing/invoices` | รายการ Invoice |
| GET | `/api/b2b/billing/invoices/[id]` | รายละเอียด Invoice |
| GET | `/api/b2b/billing/usage` | ดู Usage ปัจจุบัน |

### 6.3 Webhook Integrations (NEW)

| Endpoint | Trigger | Payload |
|----------|---------|---------|
| `POST /api/webhooks/payment` | Payment Completed/Failed | payment_id, status, amount |
| `POST /api/webhooks/partner/[partnerId]` | Partner Event | varies by partner |

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
| **Behavioral Persona** | การจัดกลุ่มผู้ใช้ตามพฤติกรรมการเล่น |

### B. Related Documents

| Document | Path | Description |
|----------|------|-------------|
| BRD v1 | `_docs/01-brd/brd.md` | Business Requirements v1 |
| BRD v2 | `_docs/01-brd/brd-v2.md` | Business Requirements v2 |
| SRD v1 | `_docs/02-srd/srd.md` | System Requirements v1 |
| Requirement v1 | `_docs/00-requirement/requirement-v1.md` | Original Requirements |
| Requirement v2 | `_docs/00-requirement/requirement-v2/` | Updated Requirements |

### C. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | - | - | Initial SRD for Dating App with Gamification |
| 2.0 | Feb 2026 | - | Major update: B2B Platform, PlayCoin Loyalty, Enhanced B2C Features |

---

> **Document Status:** Draft
> **Next Review:** After BRD v2 Final Approval
> **Approvers:** Product Owner, Tech Lead, Business Stakeholders
