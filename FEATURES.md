# PlayMyDate v2 - Feature List

## B2C Features (Dating Platform)

### Authentication & Profile
| Feature | Description |
|---------|-------------|
| User Registration | สมัครสมาชิกด้วย email/password |
| User Login | เข้าสู่ระบบ |
| Profile Creation | สร้างโปรไฟล์พร้อม interests, playing style, bio |
| Photo Upload | อัปโหลดรูปโปรไฟล์ |
| Voice Note | บันทึกเสียงแนะนำตัว |
| Referral System | ระบบชวนเพื่อน รับ PlayCoins |

### Matching System
| Feature | Description |
|---------|-------------|
| AI Matchmaking | จับคู่อัตโนมัติตาม playing style และ interests |
| Compatibility Score | คำนวณความเข้ากันได้ (0-100%) |
| Find Matches | ค้นหา matches ใหม่ |
| Match List | ดูรายการ matches ทั้งหมด |

### Messaging & Activities
| Feature | Description |
|---------|-------------|
| Real-time Chat | แชทกับ matches |
| Typing Indicator | แสดงสถานะกำลังพิมพ์ |
| Daily Missions | ภารกิจรายวันทำร่วมกัน |
| Co-op Activities | กิจกรรมร่วมกัน (2 Truths 1 Lie, 20 Questions, etc.) |
| Activity Rewards | ได้ intimacy points และ PlayCoins |

### Chemistry/Intimacy System
| Feature | Description |
|---------|-------------|
| Chemistry Meter | วัดความสนิทสนม (0-100%) |
| Identity Unlocks | เปิดเผยตัวตนตามระดับ |
| 25% Unlock | เห็น Avatar detail |
| 50% Unlock | เห็นชื่อจริง |
| 75% Unlock | เห็นรูปจริง |
| 100% Unlock | Paradise Mode |
| Mission Streak | นับจำนวนวันทำภารกิจติดต่อกัน |

### PlayCoin Economy
| Feature | Description |
|---------|-------------|
| Wallet | กระเป๋าเงิน PlayCoins |
| Daily Check-in | เช็คอินรายวัน +10 coins |
| Activity Rewards | ทำกิจกรรมได้ +10-50 coins |
| Streak Bonus | 7 วันติดต่อกัน +100 coins |
| Rewards Catalog | แลก coins เป็นของรางวัล |
| Transaction History | ประวัติการใช้งาน coins |

### Paradise Mode & Dates
| Feature | Description |
|---------|-------------|
| Venue Discovery | ค้นหาร้านอาหาร/คาเฟ่สำหรับ date |
| Venue Details | ดูรายละเอียดร้าน (รูป, rating, ราคา) |
| Date Booking | จอง date ผ่านแอป |
| QR Check-in | เช็คอินที่ร้านด้วย QR +50-200 coins |
| Split Bill | เลือกวิธีแบ่งจ่าย |

---

## B2B Features (Merchant Portal)

### Merchant Management
| Feature | Description |
|---------|-------------|
| Merchant Registration | สมัครเป็น partner |
| Merchant Login | เข้าสู่ระบบ merchant |
| Venue Management | จัดการร้านค้า/สาขา |
| Booking Management | รับและจัดการ bookings |

### Campaign System
| Feature | Description |
|---------|-------------|
| Campaign Creation | สร้าง campaign โฆษณา |
| Budget Management | ตั้งงบประมาณ |
| Target Audience | กำหนดกลุ่มเป้าหมาย |
| CPA Pricing | จ่ายเมื่อมีการจอง |
| CPMI Pricing | จ่ายเมื่อมี interaction |
| Branded Quests | สร้างภารกิจแบรนด์ |

### Analytics
| Feature | Description |
|---------|-------------|
| Dashboard Overview | ภาพรวมผลการดำเนินงาน |
| Campaign Performance | วัดผล campaign |
| Conversion Metrics | ตัวเลข conversion |
| Behavioral Insights | รายงานพฤติกรรมผู้ใช้ |

---

## Pages & Routes

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | User login |
| `/register` | User registration |
| `/merchant-login` | Merchant login |

### User Pages (Authenticated)
| Route | Description |
|-------|-------------|
| `/matches` | Match list |
| `/matches/[id]` | Chat & activities with match |
| `/dates` | Date planning |
| `/dates/venues` | Browse venues |
| `/dates/venues/[id]` | Venue details |
| `/dates/bookings` | My bookings |
| `/profile` | Profile settings |
| `/wallet` | PlayCoin wallet |
| `/rewards` | Rewards catalog |

### Merchant Pages (B2B)
| Route | Description |
|-------|-------------|
| `/dashboard` | Merchant dashboard |
| `/campaigns` | Campaign management |
| `/campaigns/new` | Create campaign |
| `/campaigns/[id]` | Campaign details |
| `/quests` | Branded quests |
| `/quests/new` | Create quest |
| `/venues` | Venue management |
| `/analytics` | Analytics dashboard |
| `/billing` | Billing & invoices |
| `/settings` | Merchant settings |

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| alice@demo.com | password123 | User |
| bob@demo.com | password123 | User |
| charlie@demo.com | password123 | User |
| diana@demo.com | password123 | User |
| emma@demo.com | password123 | User |
| frank@demo.com | password123 | User |
| grace@demo.com | password123 | User |
| henry@demo.com | password123 | User |
| admin@caferomantique.com | merchant123 | Merchant |
| admin@adventureparkbkk.com | merchant123 | Merchant |

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
