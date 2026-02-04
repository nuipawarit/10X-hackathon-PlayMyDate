# PlayMyDate v2 - Feature List

## B2C Features (Dating Platform)

### Authentication & Profile
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| User Registration | สมัครสมาชิกด้วย email/password | `/register` | Login page → Sign up link |
| User Login | เข้าสู่ระบบ | `/login` | Landing page → Login button |
| Profile Creation | สร้างโปรไฟล์พร้อม interests, playing style, bio | `/profile` | Bottom nav → Profile |
| Photo Upload | อัปโหลดรูปโปรไฟล์ | `/profile` | Profile page → Photo section |
| Voice Note | บันทึกเสียงแนะนำตัว | `/profile` | Profile page → Voice section |
| Referral System | ระบบชวนเพื่อน รับ PlayCoins | `/wallet` | Wallet page → Referral card |

### Matching System
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| AI Matchmaking | จับคู่อัตโนมัติตาม playing style และ interests | `/matches` | Bottom nav → Matches |
| Compatibility Score | คำนวณความเข้ากันได้ (0-100%) | `/matches` | Match card display |
| Find Matches | ค้นหา matches ใหม่ | `/matches` | Matches page → Find button |
| Match List | ดูรายการ matches ทั้งหมด | `/matches` | Bottom nav → Matches |

### Messaging & Activities
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Real-time Chat | แชทกับ matches | `/matches/[id]` | Matches list → Click match |
| Typing Indicator | แสดงสถานะกำลังพิมพ์ | `/matches/[id]` | Chat interface |
| Daily Missions | ภารกิจรายวันทำร่วมกัน | `/matches/[id]` | Chat → Activities section |
| Co-op Activities | กิจกรรมร่วมกัน (2 Truths 1 Lie, 20 Questions, etc.) | `/matches/[id]/activity/[activityId]` | Chat → Activity button |
| Activity Rewards | ได้ intimacy points และ PlayCoins | `/matches/[id]/activity/[activityId]` | Complete activity |

### Chemistry/Intimacy System
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Chemistry Meter | วัดความสนิทสนม (0-100%) | `/matches/[id]` | Chat page header |
| Identity Unlocks | เปิดเผยตัวตนตามระดับ | `/matches/[id]` | Chat → Unlocks section |
| 25% Unlock | เห็น Avatar detail | `/matches/[id]` | Auto unlock at 25% |
| 50% Unlock | เห็นชื่อจริง | `/matches/[id]` | Auto unlock at 50% |
| 75% Unlock | เห็นรูปจริง | `/matches/[id]` | Auto unlock at 75% |
| 100% Unlock | Paradise Mode | `/matches/[id]` | Auto unlock at 100% |
| Mission Streak | นับจำนวนวันทำภารกิจติดต่อกัน | `/matches/[id]` | Chat page display |

### PlayCoin Economy
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Wallet | กระเป๋าเงิน PlayCoins | `/wallet` | Bottom nav → Wallet |
| Daily Check-in | เช็คอินรายวัน +10 coins | `/wallet` | Wallet → Check-in button |
| Activity Rewards | ทำกิจกรรมได้ +10-50 coins | `/matches/[id]/activity/[activityId]` | Complete activity |
| Streak Bonus | 7 วันติดต่อกัน +100 coins | `/wallet` | Auto reward |
| Rewards Catalog | แลก coins เป็นของรางวัล | `/rewards` | Wallet → View Rewards |
| Transaction History | ประวัติการใช้งาน coins | `/wallet` | Wallet → History tab |

### Paradise Mode & Dates
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Venue Discovery | ค้นหาร้านอาหาร/คาเฟ่สำหรับ date | `/dates` | Bottom nav → Dates |
| Venue Details | ดูรายละเอียดร้าน (รูป, rating, ราคา) | `/dates/venues/[id]` | Venues list → Click venue |
| Date Booking | จอง date ผ่านแอป | `/dates/venues/[id]` | Venue detail → Book button |
| QR Check-in | เช็คอินที่ร้านด้วย QR +50-200 coins | `/dates` | Dates page → QR tab |
| Split Bill | เลือกวิธีแบ่งจ่าย | `/dates/bookings` | Booking detail |
| My Bookings | ดูรายการจองทั้งหมด | `/dates/bookings` | Dates page → Bookings tab |

---

## B2B Features (Merchant Portal)

### Merchant Management
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Merchant Registration | สมัครเป็น partner | `/merchant-register` | Merchant Login → Register link |
| Merchant Login | เข้าสู่ระบบ merchant | `/merchant-login` | Landing page → Merchant Login |
| Dashboard | ภาพรวมธุรกิจ | `/dashboard` | Side nav → Dashboard |
| Venue Management | จัดการร้านค้า/สาขา | `/venues` | Side nav → Venues |
| Venue Detail | ดูรายละเอียดร้าน | `/venues/[id]` | Venues list → Click venue |
| Venue Edit | แก้ไขข้อมูลร้าน | `/venues/[id]/edit` | Venue detail → Edit button |
| Booking Management | รับและจัดการ bookings | `/bookings` | Side nav → Bookings |
| Settings | ตั้งค่าบัญชี merchant | `/settings` | Side nav → Settings |

### Campaign System
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Campaign List | รายการ campaigns ทั้งหมด | `/campaigns` | Side nav → Campaigns |
| Campaign Creation | สร้าง campaign โฆษณา | `/campaigns/new` | Campaigns → Create button |
| Campaign Detail | ดูรายละเอียด campaign | `/campaigns/[id]` | Campaigns list → Click campaign |
| Campaign Edit | แก้ไข campaign | `/campaigns/[id]/edit` | Campaign detail → Edit button |
| Budget Management | ตั้งงบประมาณ | `/campaigns/new` | Campaign form |
| Target Audience | กำหนดกลุ่มเป้าหมาย | `/campaigns/new` | Campaign form |
| CPA Pricing | จ่ายเมื่อมีการจอง | `/campaigns/new` | Campaign form → Pricing |
| CPMI Pricing | จ่ายเมื่อมี interaction | `/campaigns/new` | Campaign form → Pricing |
| Campaign Performance | วัดผล campaign | `/campaigns/[id]/performance` | Campaign detail → Performance tab |
| Branded Quests | สร้างภารกิจแบรนด์ | `/quests` | Side nav → Quests |

### Quest Management
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Quest List | รายการ quests ทั้งหมด | `/quests` | Side nav → Quests |
| Quest Creation | สร้าง branded quest | `/quests/new` | Quests → Create button |
| Quest Detail | ดูรายละเอียด quest | `/quests/[id]` | Quests list → Click quest |
| Quest Rewards | กำหนด coin rewards | `/quests/new` | Quest form |

### Analytics & Billing
| Feature | Description | URL Path | Access |
|---------|-------------|----------|--------|
| Dashboard Overview | ภาพรวมผลการดำเนินงาน | `/dashboard` | Side nav → Dashboard |
| Analytics Dashboard | รายงานละเอียด | `/analytics` | Side nav → Analytics |
| Campaign Performance | วัดผล campaign | `/campaigns/[id]/performance` | Campaign → Performance tab |
| Conversion Metrics | ตัวเลข conversion | `/analytics` | Analytics page |
| Behavioral Insights | รายงานพฤติกรรมผู้ใช้ | `/analytics` | Analytics → Audience tab |
| Report Builder | สร้างรายงานกำหนดเอง | `/analytics` | Analytics → Reports |
| Billing Overview | ภาพรวมการเรียกเก็บเงิน | `/billing` | Side nav → Billing |
| Invoice List | รายการใบแจ้งหนี้ | `/billing` | Billing → Invoices tab |
| Invoice Detail | รายละเอียดใบแจ้งหนี้ | `/billing/invoices/[id]` | Invoice list → Click invoice |

---

## Demo Accounts

| Email | Password | Role | Start Page |
|-------|----------|------|------------|
| alice@demo.com | password123 | User | `/matches` |
| bob@demo.com | password123 | User | `/matches` |
| charlie@demo.com | password123 | User | `/matches` |
| diana@demo.com | password123 | User | `/matches` |
| emma@demo.com | password123 | User | `/matches` |
| frank@demo.com | password123 | User | `/matches` |
| grace@demo.com | password123 | User | `/matches` |
| henry@demo.com | password123 | User | `/matches` |
| admin@caferomantique.com | merchant123 | Merchant | `/dashboard` |
| admin@adventureparkbkk.com | merchant123 | Merchant | `/dashboard` |

---

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI + shadcn/ui

### Backend
- Next.js API Routes
- PostgreSQL (Neon)
- Lucia Auth
- Vercel Blob Storage

---

*Built at Hackathon 2026*
