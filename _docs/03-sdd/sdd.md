> ⚠️ This document is a fixed template.
> Do NOT change section order or headings.
> Fill content only.

# SDD: System Design Document

## 1. Architecture Overview

ระบบหาคู่ออนไลน์ใช้สถาปัตยกรรมแบบ **Microservices** แบ่งเป็น 3 ชั้นหลัก:

### 1.1 Presentation Layer (Frontend)

- **Mobile App (React Native / Flutter)**: แอปมือถือสำหรับผู้ใช้ทั่วไป
- **Web Admin Dashboard**: สำหรับทีมจัดการระบบ (ถ้าจำเป็น)
- ใช้ **REST API** และ **WebSocket** สำหรับการสื่อสารแบบเรียลไทม์

### 1.2 Application Layer (Backend Services)

แบ่งเป็น microservices หลัก:

- **User Service**: จัดการข้อมูลผู้ใช้และโปรไฟล์
- **Matching Service**: วิเคราะห์และจับคู่ผู้ใช้
- **Activity Service**: จัดการกิจกรรมและภารกิจ
- **Communication Service**: จัดการข้อความและการสื่อสาร
- **Intimacy Service**: ติดตามความสนิทและปลดล็อกข้อมูล
- **Date Planning Service**: แนะนำสถานที่และกิจกรรมเดท
- **Payment Service**: จัดการสมาชิกและการชำระเงิน

### 1.3 Data Layer

- **Primary Database (PostgreSQL)**: เก็บข้อมูลหลัก (ผู้ใช้, การจับคู่, กิจกรรม)
- **Cache Layer (Redis)**: สำหรับ session, real-time data, และ rate limiting
- **Message Queue (RabbitMQ / AWS SQS)**: สำหรับ async tasks (เช่น การจับคู่, การส่ง notification)

### 1.4 External Services

- **Payment Gateway**: สำหรับการชำระเงิน
- **File Storage (AWS S3 / Cloud Storage)**: สำหรับเก็บรูปภาพและไฟล์สื่อ
- **Push Notification Service**: สำหรับแจ้งเตือน
- **Video/Audio Call Service**: สำหรับการโทรและวิดีโอคอล (เมื่อปลดล็อกแล้ว)

### 1.5 Architecture Pattern

- **API Gateway**: จุดเข้าเดียวสำหรับ frontend (จัดการ authentication, routing, rate limiting)
- **Service-to-Service Communication**: ใช้ REST API และ message queue
- **Event-Driven Architecture**: สำหรับการอัปเดตสถานะที่ต้อง sync หลาย services (เช่น เมื่อความสนิทเพิ่มขึ้น)

## 2. Component Responsibilities

### 2.1 User Service

**หน้าที่หลัก:**

- จัดการการลงทะเบียนและ authentication
- จัดการข้อมูลโปรไฟล์ (ทั้งข้อมูลที่เปิดเผยและข้อมูลที่ยังไม่เปิดเผย)
- จัดการการอัปเดตข้อมูลผู้ใช้
- จัดการการลบบัญชี (soft delete)

**ข้อมูลที่จัดการ:**

- ข้อมูลพื้นฐาน (username, email, password hash)
- ข้อมูลโปรไฟล์ที่เปิดเผย (สไตล์การเล่น, ความสนใจ)
- ข้อมูลที่ยังไม่เปิดเผย (รูป, ชื่อจริง, อาชีพ) - เก็บแบบ encrypted
- สถานะสมาชิก

### 2.2 Matching Service

**หน้าที่หลัก:**

- วิเคราะห์สไตล์การเล่นและความสนใจของผู้ใช้
- คำนวณความเข้ากันได้ (compatibility score)
- จัดการการจับคู่ (matching algorithm)
- จัดการสถานะการจับคู่ (matched, unmatched, blocked)

**ข้อมูลที่จัดการ:**

- Compatibility scores
- Match records
- Matching preferences และ filters

### 2.3 Activity Service

**หน้าที่หลัก:**

- จัดการรายการกิจกรรมและภารกิจที่พร้อมใช้งาน
- สร้างกิจกรรมให้กับคู่ที่จับคู่กัน
- ติดตามความคืบหน้าและผลลัพธ์ของกิจกรรม
- จัดการสถานะกิจกรรม (pending, in-progress, completed, failed)

**ข้อมูลที่จัดการ:**

- Activity templates และ definitions
- Activity instances (แต่ละครั้งที่ผู้ใช้ทำกิจกรรม)
- Activity results และ progress

### 2.4 Communication Service

**หน้าที่หลัก:**

- จัดการการส่งข้อความระหว่างผู้ใช้
- จัดการสถานะการสนทนา (unread, read, archived)
- จัดการการโทรและวิดีโอคอล (เมื่อปลดล็อกแล้ว)
- จัดการ notifications

**ข้อมูลที่จัดการ:**

- Messages (text, media)
- Conversation threads
- Call logs (เมื่อปลดล็อกแล้ว)

### 2.5 Intimacy Service

**หน้าที่หลัก:**

- ติดตามระดับความสนิทระหว่างผู้ใช้ที่จับคู่กัน
- คำนวณ intimacy score จากกิจกรรมและการสื่อสาร
- จัดการการปลดล็อกข้อมูลตามเกณฑ์ความสนิท
- จัดการสิทธิ์การเข้าถึงข้อมูล

**ข้อมูลที่จัดการ:**

- Intimacy scores (per match pair)
- Unlock history และ milestones
- Access permissions

### 2.6 Date Planning Service

**หน้าที่หลัก:**

- แนะนำสถานที่หรือกิจกรรมเดทที่เหมาะสม
- จัดการการวางแผนนัดเจอ
- จัดการค่าใช้จ่ายเดท (tracking และ transparency)
- เชื่อมต่อกับร้านอาหาร/คาเฟ่ (สำหรับอนาคต)

**ข้อมูลที่จัดการ:**

- Recommended venues และ activities
- Date plans และ reservations
- Expense records

### 2.7 Payment Service

**หน้าที่หลัก:**

- จัดการค่าสมาชิก (subscription plans)
- จัดการการชำระเงิน (integration กับ payment gateway)
- จัดการค่าใช้จ่ายเดท
- จัดการ billing และ invoices

**ข้อมูลที่จัดการ:**

- Subscription plans และ status
- Payment transactions
- Billing records

### 2.8 API Gateway

**หน้าที่หลัก:**

- จุดเข้าเดียวสำหรับ frontend
- จัดการ authentication และ authorization
- Rate limiting และ throttling
- Request routing ไปยัง services ที่เหมาะสม
- Request/response logging และ monitoring

## 3. API / Interface Design (Draft)

| Method    | Interface                                                            | Description                                                                       |
| --------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| POST      | `/api/v1/auth/register`                                              | ลงทะเบียนผู้ใช้ใหม่                                                               |
| POST      | `/api/v1/auth/login`                                                 | เข้าสู่ระบบ                                                                       |
| POST      | `/api/v1/auth/logout`                                                | ออกจากระบบ                                                                        |
| POST      | `/api/v1/auth/refresh`                                               | Refresh access token                                                              |
| GET       | `/api/v1/users/me`                                                   | ดึงข้อมูลผู้ใช้ปัจจุบัน                                                           |
| PUT       | `/api/v1/users/me/profile`                                           | อัปเดตข้อมูลโปรไฟล์ที่เปิดเผย                                                     |
| PUT       | `/api/v1/users/me/private-data`                                      | อัปเดตข้อมูลที่ยังไม่เปิดเผย (เก็บไว้)                                            |
| GET       | `/api/v1/users/me/matches`                                           | ดึงรายการผู้ใช้ที่จับคู่กัน                                                       |
| GET       | `/api/v1/matches/{matchId}`                                          | ดึงรายละเอียดการจับคู่                                                            |
| POST      | `/api/v1/matches/{matchId}/unmatch`                                  | ยกเลิกการจับคู่                                                                   |
| GET       | `/api/v1/matches/{matchId}/activities`                               | ดึงรายการกิจกรรมที่พร้อมทำ                                                        |
| POST      | `/api/v1/matches/{matchId}/activities/{activityId}/start`            | เริ่มทำกิจกรรม                                                                    |
| PUT       | `/api/v1/matches/{matchId}/activities/{activityInstanceId}/progress` | อัปเดตความคืบหน้าของกิจกรรม                                                       |
| POST      | `/api/v1/matches/{matchId}/activities/{activityInstanceId}/complete` | เสร็จสิ้นกิจกรรม                                                                  |
| GET       | `/api/v1/matches/{matchId}/messages`                                 | ดึงข้อความใน conversation                                                         |
| POST      | `/api/v1/matches/{matchId}/messages`                                 | ส่งข้อความ                                                                        |
| PUT       | `/api/v1/matches/{matchId}/messages/{messageId}/read`                | ทำเครื่องหมายว่าอ่านแล้ว                                                          |
| GET       | `/api/v1/matches/{matchId}/intimacy`                                 | ดึงระดับความสนิทปัจจุบัน                                                          |
| GET       | `/api/v1/matches/{matchId}/unlocks`                                  | ดึงรายการข้อมูลที่ปลดล็อกแล้ว                                                     |
| POST      | `/api/v1/matches/{matchId}/unlocks/{unlockType}`                     | ปลดล็อกข้อมูล (เมื่อถึงเกณฑ์)                                                     |
| GET       | `/api/v1/matches/{matchId}/date-suggestions`                         | ดึงคำแนะนำสถานที่/กิจกรรมเดท                                                      |
| POST      | `/api/v1/matches/{matchId}/date-plans`                               | สร้างแผนนัดเจอ                                                                    |
| PUT       | `/api/v1/matches/{matchId}/date-plans/{planId}/expenses`             | บันทึกค่าใช้จ่ายเดท                                                               |
| GET       | `/api/v1/subscriptions/plans`                                        | ดึงรายการแผนสมาชิก                                                                |
| POST      | `/api/v1/subscriptions/subscribe`                                    | สมัครสมาชิก                                                                       |
| GET       | `/api/v1/subscriptions/me`                                           | ดึงสถานะสมาชิกปัจจุบัน                                                            |
| POST      | `/api/v1/subscriptions/cancel`                                       | ยกเลิกสมาชิก                                                                      |
| GET       | `/api/v1/calls/{matchId}/token`                                      | ดึง token สำหรับการโทร/วิดีโอคอล (เมื่อปลดล็อกแล้ว)                               |
| WebSocket | `/ws`                                                                | WebSocket connection สำหรับ real-time updates (messages, activity progress, etc.) |

## 4. Data Model (Draft)

### 4.1 Users Table

```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  -- ข้อมูลที่เปิดเผย
  display_name VARCHAR(100),
  playing_style JSONB, -- สไตล์การเล่น
  interests JSONB, -- ความสนใจ
  -- ข้อมูลที่ยังไม่เปิดเผย (encrypted)
  real_name_encrypted TEXT,
  photo_url_encrypted TEXT,
  occupation_encrypted TEXT,
  -- สถานะ
  subscription_status VARCHAR(50), -- free, premium, etc.
  subscription_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 4.2 Matches Table

```sql
matches (
  id UUID PRIMARY KEY,
  user1_id UUID REFERENCES users(id),
  user2_id UUID REFERENCES users(id),
  compatibility_score DECIMAL(5,2), -- 0-100
  status VARCHAR(50), -- matched, unmatched, blocked
  matched_at TIMESTAMP DEFAULT NOW(),
  unmatched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
)
```

### 4.3 Activities Table

```sql
activities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100), -- icebreaker, puzzle, quiz, etc.
  duration_minutes INTEGER,
  required_intimacy_level INTEGER DEFAULT 0,
  config JSONB, -- configuration สำหรับแต่ละกิจกรรม
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

activity_instances (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  activity_id UUID REFERENCES activities(id),
  status VARCHAR(50), -- pending, in_progress, completed, failed
  progress JSONB, -- ความคืบหน้าของกิจกรรม
  result JSONB, -- ผลลัพธ์ของกิจกรรม
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 4.4 Messages Table

```sql
messages (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(50), -- text, image, audio, etc.
  media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 4.5 Intimacy Tracking Table

```sql
intimacy_scores (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  score DECIMAL(5,2) NOT NULL, -- 0-100
  factors JSONB, -- ปัจจัยที่ส่งผลต่อคะแนน (activities, messages, time, etc.)
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
)

unlocks (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  unlock_type VARCHAR(100), -- photo, real_name, occupation, phone_call, video_call
  unlocked_at TIMESTAMP DEFAULT NOW(),
  intimacy_score_at_unlock DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 4.6 Date Planning Tables

```sql
date_suggestions (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  venue_name VARCHAR(255),
  venue_type VARCHAR(100), -- restaurant, cafe, activity, etc.
  location JSONB, -- coordinates, address
  estimated_cost DECIMAL(10,2),
  description TEXT,
  suggested_at TIMESTAMP DEFAULT NOW(),
  is_selected BOOLEAN DEFAULT false
)

date_plans (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  suggestion_id UUID REFERENCES date_suggestions(id),
  planned_date TIMESTAMP,
  status VARCHAR(50), -- planned, confirmed, completed, cancelled
  total_cost DECIMAL(10,2),
  cost_split JSONB, -- การแบ่งค่าใช้จ่าย
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 4.7 Subscriptions & Payments Tables

```sql
subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB, -- ฟีเจอร์ที่ได้รับ
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
)

subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(50), -- active, expired, cancelled
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'THB',
  payment_method VARCHAR(100),
  payment_gateway_transaction_id VARCHAR(255),
  status VARCHAR(50), -- pending, completed, failed, refunded
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## 5. Edge Cases & Risks

### 5.1 Security Risks

- **ข้อมูลส่วนตัวรั่วไหล**: ต้องเข้ารหัสข้อมูลที่ยังไม่เปิดเผย และควบคุมการเข้าถึงอย่างเข้มงวด
- **การปลดล็อกข้อมูลโดยไม่ได้รับอนุญาต**: ต้องตรวจสอบ intimacy score และ permissions ก่อนปลดล็อกทุกครั้ง
- **การจับคู่ซ้ำซ้อน**: ต้องป้องกันการจับคู่ซ้ำระหว่างผู้ใช้คู่เดียวกัน
- **การใช้งานผิดปกติ**: ต้องมี rate limiting และ monitoring เพื่อป้องกัน spam หรือ abuse

### 5.2 Data Consistency

- **Intimacy score ไม่ sync**: เมื่อมีการทำกิจกรรมหรือส่งข้อความ ต้องอัปเดต intimacy score ให้ sync กัน
- **สถานะการจับคู่ไม่ตรงกัน**: ต้องใช้ distributed locking หรือ transaction เพื่อป้องกัน race condition
- **ข้อมูลกิจกรรมไม่ตรงกัน**: ต้องมี mechanism เพื่อ sync ความคืบหน้าของกิจกรรมระหว่างผู้ใช้ทั้งสองฝ่าย

### 5.3 Performance Issues

- **การจับคู่ช้า**: Algorithm การจับคู่อาจช้าถ้ามีผู้ใช้จำนวนมาก ต้องใช้ caching และ background processing
- **การโหลดข้อความช้า**: ต้องมี pagination และ lazy loading สำหรับข้อความเก่า
- **Real-time updates ล่าช้า**: ต้องใช้ WebSocket และ message queue เพื่อให้ real-time updates ทำงานได้ดี

### 5.4 Business Logic Edge Cases

- **ผู้ใช้ยกเลิกการจับคู่ระหว่างทำกิจกรรม**: ต้องจัดการสถานะกิจกรรมให้ถูกต้อง (cancel หรือ pause)
- **ผู้ใช้ปลดล็อกข้อมูลแล้วแต่ยกเลิกการจับคู่**: ต้องตัดสินใจว่าข้อมูลที่ปลดล็อกแล้วจะยังคงเปิดเผยหรือไม่
- **ผู้ใช้ไม่ตอบสนองกิจกรรม**: ต้องมี timeout mechanism และ notification เพื่อเตือนผู้ใช้
- **ค่าใช้จ่ายเดทไม่ตรงกัน**: ต้องมี mechanism เพื่อให้ทั้งสองฝ่ายยืนยันค่าใช้จ่าย

### 5.5 External Service Failures

- **Payment Gateway ล้มเหลว**: ต้องมี retry mechanism และ fallback options
- **File Storage ล้มเหลว**: ต้องมี error handling และ alternative storage
- **Video/Audio Call Service ล้มเหลว**: ต้องแจ้งผู้ใช้และมี fallback options

## 6. Design Notes

### 6.1 Progressive Disclosure Strategy

- ใช้ **intimacy score** เป็นตัววัดความสนิท โดยคำนวณจาก:
  - จำนวนกิจกรรมที่ทำร่วมกัน
  - จำนวนข้อความที่ส่ง
  - เวลาที่ใช้ในการสื่อสาร
  - ผลลัพธ์ของกิจกรรม (ถ้าทำได้ดีจะได้คะแนนเพิ่ม)
- กำหนด **thresholds** สำหรับการปลดล็อกแต่ละประเภท:
  - Level 1 (20-30): ปลดล็อกชื่อจริง
  - Level 2 (40-50): ปลดล็อกรูป
  - Level 3 (60-70): ปลดล็อกอาชีพ
  - Level 4 (80+): ปลดล็อกการโทร/วิดีโอคอล

### 6.2 Matching Algorithm Approach

- ใช้ **hybrid approach**:
  - **Content-based filtering**: จากสไตล์การเล่นและความสนใจ
  - **Collaborative filtering**: จากพฤติกรรมการทำกิจกรรม (ถ้ามีข้อมูลเพียงพอ)
  - **Behavioral signals**: จากพฤติกรรมการใช้งานแอป
- เน้น **quality over quantity**: จับคู่จำนวนน้อยแต่คุณภาพสูง แทนการจับคู่จำนวนมาก

### 6.3 Activity Design Principles

- กิจกรรมต้อง **engaging** และ **interactive**: ต้องให้ทั้งสองฝ่ายมีส่วนร่วม
- กิจกรรมต้อง **low-pressure**: ไม่ทำให้ผู้ใช้รู้สึกกดดันหรืออึดอัด
- กิจกรรมต้อง **progressive**: เริ่มจากง่ายไปยาก เพื่อให้ผู้ใช้รู้สึกสบายใจ
- กิจกรรมต้อง **measurable**: สามารถวัดผลและให้คะแนนได้

### 6.4 Communication Flow

- เริ่มจากการทำกิจกรรมร่วมกันก่อน เพื่อลดความ awkward
- เมื่อผ่านกิจกรรมแล้ว ระบบจะแนะนำหัวข้อคุยจากผลลัพธ์ของกิจกรรม
- ค่อยๆ เพิ่มช่องทางการสื่อสารตามระดับความสนิท

### 6.5 Scalability Considerations

- ใช้ **horizontal scaling** สำหรับ services ที่รับ load สูง (เช่น Matching Service, Communication Service)
- ใช้ **caching** อย่างกว้างขวาง (Redis) สำหรับข้อมูลที่อ่านบ่อย
- ใช้ **message queue** สำหรับ async tasks เพื่อไม่ให้ block main flow
- ใช้ **database sharding** หรือ **read replicas** ถ้าจำเป็น

### 6.6 Implementation Priority

**Phase 1 (MVP):**

- User Service (registration, profile management)
- Matching Service (basic matching algorithm)
- Activity Service (basic activities)
- Communication Service (text messaging)
- Intimacy Service (basic tracking และ unlocks)

**Phase 2:**

- Date Planning Service
- Payment Service
- Video/Audio Call integration
- Advanced matching algorithm

**Phase 3:**

- Advanced activities และ gamification
- Integration กับร้านอาหาร/คาเฟ่
- Analytics และ recommendations
