# PlayMyDate v2

## Unified Relationship Economy Platform

> **"Turn Dating into a Journey, Not Just a Swipe"**

---

## Project Overview

**PlayMyDate v2** คือแพลตฟอร์มหาคู่รูปแบบใหม่ที่เปลี่ยนประสบการณ์ออนไลน์เดทจาก "ปัด-ทิ้ง" ให้กลายเป็น "การเดินทางแห่งความสัมพันธ์" ผ่านระบบ gamification, AI และ virtual economy

### 3 Pillars Strategy

| Pillar | Role | Description |
|--------|------|-------------|
| **Community Platform** | Magnet | ดึงดูด users ด้วย gamified dating experience |
| **PlayCoin Economy** | Blood | สร้าง engagement loop ด้วย virtual currency |
| **B2B Platform** | Brain | สร้างรายได้จาก merchants และ brands |

---

## Problem Statement

### สำหรับ Users (B2C)

| Problem | Pain Point |
|---------|------------|
| **Swipe Fatigue** | ปัดซ้ายขวาไม่รู้จบ ไม่เกิด meaningful connection |
| **Ghosting Culture** | คุยกันไม่กี่ข้อความก็หายไป ไม่มี commitment |
| **Awkward First Chat** | ไม่รู้จะเริ่มคุยอะไร "Hi สวัสดี" แล้วก็จบ |
| **Online → Offline Gap** | จับคู่ได้แต่ไม่เคยได้เจอตัวจริง |
| **No Post-Match Value** | ได้คู่แล้วก็ลบแอป ไม่มี incentive ให้อยู่ต่อ |

### สำหรับ Businesses (B2B)

| Problem | Pain Point |
|---------|------------|
| **Blind Targeting** | โฆษณาแบบเดิมไม่เข้าถึง dating audience |
| **Ad Blindness** | Users ไม่สนใจ ads ในแอปหาคู่ |
| **Cold Traffic** | ลูกค้าที่มาไม่มี intent ชัดเจน |
| **No Behavioral Data** | ไม่รู้พฤติกรรมของคู่รักในการตัดสินใจ |

---

## Solution & Features

### Pillar 1: Gamified Dating Journey

แทนที่จะปัดซ้ายขวา users จะได้ผ่าน **4 Phases** ของการสร้างความสัมพันธ์:

#### Phase 1: The Masquerade
- สร้าง **AI Avatar** แทนรูปจริง (3 สไตล์: Cartoon, Realistic, Pixel)
- บันทึก **Voice Note** แนะนำตัว
- **AI Matchmaker** จับคู่ตาม play style และ behavioral persona

#### Phase 2: The Mission Run
- ทำ **Daily Missions** ร่วมกับคู่แมตช์
- เล่น **Co-op Mini Games**: Blind Taste, Rescue Mission, 2 Truths 1 Lie
- **AI Game Master** ให้ challenges และ conversation starters

#### Phase 3: The Reveal
- **Chemistry Meter** เพิ่มขึ้นจากการทำ missions
- ปลดล็อคข้อมูลตัวจริงทีละขั้น:
  - 25% → เห็น Avatar detail
  - 50% → เปิดเผยชื่อจริง
  - 75% → เห็นรูปจริง
  - 100% → เข้า Paradise Mode

#### Phase 4: Paradise Mode
- **Smart Date Planner** แนะนำ venue ตาม preference
- **Booking Integration** จองร้านอาหารในแอป
- **Split Bill** แบ่งจ่ายอัตโนมัติ
- **QR Check-in** ที่ร้าน → รับ PlayCoins

---

### Pillar 2: PlayCoin Economy

Virtual currency ที่สร้าง **sticky engagement** ให้ users มีเหตุผลอยู่ต่อแม้จะได้คู่แล้ว

#### Earn Mechanics (วิธีได้เหรียญ)

| Action | Coins |
|--------|-------|
| Daily Check-in | 10 |
| Complete Mission | 20-50 |
| Chat 7 Days Streak | 100 |
| First Date Completed | 500 |
| QR Check-in at Venue | 50-200 |
| Refer a Friend | 200 |

#### Burn Mechanics (วิธีใช้เหรียญ)

| Item | Cost |
|------|------|
| Avatar Customization | 50-200 |
| Power-ups (Super Like, Rewind) | 10-50 |
| Real Rewards (Vouchers) | 500+ |
| Exchange to Partner Points | Variable |

#### Partner Ecosystem
แลก PlayCoins กับ loyalty programs:
- The 1 Card
- Blue Card
- Starbucks Rewards
- และอื่นๆ

---

### Pillar 3: B2B Platform

Dashboard สำหรับ **Merchants** และ **Brands** เข้าถึง dating audience

#### สำหรับ Restaurants/Venues
- **Venue Listing** ลงทะเบียนร้านในระบบ
- **Booking Management** รับ bookings จาก couples
- **QR Check-in System** ยืนยันการมาใช้บริการ
- **Performance Analytics** ดู foot traffic และ conversions

#### สำหรับ Brands
- **Branded Quests** สร้าง mini-game แบบมีแบรนด์
- **Campaign Management** ตั้ง budget, target audience
- **CPA/CPMI Pricing**: จ่ายเมื่อเกิด action จริง
- **Behavioral Insights** รายงานพฤติกรรม dating consumers

#### Revenue Models

| Model | Description |
|-------|-------------|
| **CPA** | Cost Per Appointment - จ่ายเมื่อมีการจอง |
| **CPMI** | Cost Per Meaningful Interaction - จ่ายเมื่อ user ทำ action |
| **Data Subscription** | รายงาน insights รายเดือน |

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router) - React 19 Server Components
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with custom animations
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form validation

### Backend
- **Next.js API Routes** - Serverless endpoints
- **PostgreSQL** via **Neon** - Managed database
- **Drizzle ORM** - Type-safe database layer
- **Lucia Auth** - Session-based authentication

### Infrastructure
- **Vercel** - Serverless deployment
- **@vercel/blob** - File storage

### Key Characteristics
- ✅ Full TypeScript end-to-end
- ✅ Server Components for performance
- ✅ Database migrations with Drizzle Kit
- ✅ Secure cookie-based sessions
- ✅ Mobile-responsive UI

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   B2C App   │  │   B2B App   │  │   Landing Page      │  │
│  │  (Dating)   │  │ (Merchants) │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
└─────────┼────────────────┼──────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Auth    │  │  Match   │  │  Dates   │  │   PlayCoin   │ │
│  │  /api/   │  │  /api/   │  │  /api/   │  │   /api/      │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       │             │             │               │          │
│  ┌────┴─────────────┴─────────────┴───────────────┴───────┐ │
│  │                    Service Layer                        │ │
│  │  matching.ts | booking.ts | playcoin.ts | campaign.ts   │ │
│  └────────────────────────────┬────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Neon)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  users  │  │ matches │  │ venues  │  │  transactions   │ │
│  │sessions │  │chemistry│  │bookings │  │  wallets        │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Demo Flow

### User Journey (B2C)

```
1. Register
   └─> สร้าง account, เลือก interests, playing style

2. Create Avatar
   └─> AI generate avatar, record voice note

3. Get Matched
   └─> AI matchmaker หา compatible partners

4. Play Together
   └─> ทำ daily missions, เล่น co-op games

5. Build Chemistry
   └─> Chemistry meter เพิ่ม, unlock identity

6. Enter Paradise Mode
   └─> ดู venue recommendations, จอง date

7. Go on Date
   └─> QR check-in, ได้ PlayCoins

8. Redeem Rewards
   └─> ใช้ coins แลกของรางวัล
```

### Merchant Journey (B2B)

```
1. Register Business
   └─> สมัครเป็น partner venue/brand

2. Create Campaign
   └─> ตั้ง budget, target, สร้าง branded quest

3. Monitor Performance
   └─> ดู real-time analytics dashboard

4. Receive Bookings
   └─> รับ reservations จาก couples

5. Validate Check-ins
   └─> Scan QR codes, distribute rewards

6. Access Insights
   └─> ดูรายงาน behavioral analytics
```

---

## Business Model

### B2C Revenue
- **Freemium**: ฟีเจอร์พื้นฐานฟรี
- **Premium Subscription**: ฟีเจอร์เพิ่มเติม (Super Likes, Rewinds)
- **PlayCoin Purchases**: ซื้อเหรียญเพิ่ม

### B2B Revenue
- **CPA (Cost Per Appointment)**: ฿50-200/booking
- **CPMI (Cost Per Meaningful Interaction)**: ฿5-20/action
- **Branded Quest Sponsorship**: ฿10,000+/campaign
- **Data Subscription**: ฿5,000-50,000/month

### Unit Economics (Target)
- **CAC**: ฿50
- **LTV**: ฿500+
- **Payback Period**: < 30 days

---

## Competitive Advantage

| Feature | Tinder | Bumble | Hinge | **PlayMyDate** |
|---------|:------:|:------:|:-----:|:--------------:|
| Matching Logic | Photo | Photo | Profile | **AI + Behavior** |
| Interaction | Chat | Chat | Prompts | **Co-op Games** |
| AI Integration | Algo | Algo | Algo | **Active GM** |
| Identity Reveal | Instant | Instant | Instant | **Gradual** |
| Loyalty Program | ❌ | ❌ | ❌ | **✅ PlayCoin** |
| B2B Platform | Ads | Ads | Ads | **✅ Full CRM** |
| Date Booking | ❌ | ❌ | ❌ | **✅ Integrated** |
| O2O Bridge | ❌ | ❌ | ❌ | **✅ QR System** |

### Key Differentiators
1. **Journey > Swipe**: สร้าง meaningful connection ก่อนเปิดเผยตัวตน
2. **Sticky Economy**: มีเหตุผลใช้ต่อแม้ได้คู่แล้ว
3. **Full-Funnel B2B**: ไม่ใช่แค่ ads แต่เป็น complete platform
4. **Data-Driven**: Behavioral insights ที่ไม่มีที่ไหน

---

## Development Progress

### ✅ Phase 1: Core B2C + PlayCoin MVP
- User authentication (Lucia)
- Profile management with avatar
- AI matching system
- Activity/Mission system
- PlayCoin wallet & transactions

### ✅ Phase 2: Paradise Mode + B2B Basics
- Date venue system
- Booking integration
- QR check-in
- Merchant portal
- Basic analytics

### ✅ Phase 3: Full B2B + Analytics
- Campaign management
- Branded quests
- Advanced analytics dashboard
- Behavioral insights
- Performance metrics

### 🚀 Next Steps
- AI Matchmaking enhancement
- Voice/Video calling
- More partner integrations
- Mobile app (React Native)

---

## Metrics Target (Phase 1)

### B2C
- **MAU**: 100,000 users
- **Match Conversation Rate**: 70%+ (vs 30% industry)
- **Date Conversion**: 15%+ success rate
- **Post-Match Retention**: 50%+ (vs 0% typical)

### B2B
- **Partner Venues**: 100+
- **Monthly Foot Traffic**: 1,000+ directed visits
- **Brand Campaigns**: 10+ partners
- **Data Subscribers**: 20+ organizations

---

## Team

[เพิ่มข้อมูลทีมที่นี่]

---

## Contact

[เพิ่มข้อมูลติดต่อที่นี่]

---

*Built with ❤️ at Hackathon 2026*
