> ⚠️ This document is a fixed template.
> Do NOT change section order or headings.
> Fill content only.

# Implementation Checklist

## Phase 1: Setup

- [ ] สร้างโครงสร้างโปรเจค (monorepo หรือ separate repos)
- [ ] Setup database (PostgreSQL) - สร้าง schema ตาม data model
- [ ] Setup cache layer (Redis) - สำหรับ session และ real-time data
- [ ] Setup API Gateway (basic routing และ authentication middleware)
- [ ] Setup environment configuration (.env, config files)
- [ ] Setup logging และ monitoring (basic)
- [ ] Setup development environment (Docker Compose สำหรับ local dev)

## Phase 2: Core Features

### User Service

- [ ] API: POST `/api/v1/auth/register` - ลงทะเบียนผู้ใช้ใหม่
- [ ] API: POST `/api/v1/auth/login` - เข้าสู่ระบบ (JWT token)
- [ ] API: POST `/api/v1/auth/logout` - ออกจากระบบ
- [ ] API: GET `/api/v1/users/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน
- [ ] API: PUT `/api/v1/users/me/profile` - อัปเดตข้อมูลโปรไฟล์ที่เปิดเผย (playing_style, interests)
- [ ] API: PUT `/api/v1/users/me/private-data` - อัปเดตข้อมูลที่ยังไม่เปิดเผย (encrypted storage)
- [ ] Password hashing และ validation
- [ ] Basic authentication middleware

### Matching Service

- [ ] API: GET `/api/v1/users/me/matches` - ดึงรายการผู้ใช้ที่จับคู่กัน
- [ ] API: GET `/api/v1/matches/{matchId}` - ดึงรายละเอียดการจับคู่
- [ ] API: POST `/api/v1/matches/{matchId}/unmatch` - ยกเลิกการจับคู่
- [ ] Basic matching algorithm (content-based filtering จาก playing_style และ interests)
- [ ] Compatibility score calculation (0-100)
- [ ] Match status management (matched, unmatched, blocked)

### Activity Service

- [ ] สร้าง activity templates (อย่างน้อย 3-5 กิจกรรมพื้นฐาน)
- [ ] API: GET `/api/v1/matches/{matchId}/activities` - ดึงรายการกิจกรรมที่พร้อมทำ
- [ ] API: POST `/api/v1/matches/{matchId}/activities/{activityId}/start` - เริ่มทำกิจกรรม
- [ ] API: PUT `/api/v1/matches/{matchId}/activities/{activityInstanceId}/progress` - อัปเดตความคืบหน้า
- [ ] API: POST `/api/v1/matches/{matchId}/activities/{activityInstanceId}/complete` - เสร็จสิ้นกิจกรรม
- [ ] Activity status tracking (pending, in_progress, completed, failed)
- [ ] Basic activity result calculation

### Communication Service

- [ ] API: GET `/api/v1/matches/{matchId}/messages` - ดึงข้อความ (pagination)
- [ ] API: POST `/api/v1/matches/{matchId}/messages` - ส่งข้อความ (text only)
- [ ] API: PUT `/api/v1/matches/{matchId}/messages/{messageId}/read` - ทำเครื่องหมายว่าอ่านแล้ว
- [ ] WebSocket: `/ws` - Real-time message updates
- [ ] Message storage และ retrieval
- [ ] Unread message count tracking

### Intimacy Service

- [ ] API: GET `/api/v1/matches/{matchId}/intimacy` - ดึงระดับความสนิทปัจจุบัน
- [ ] API: GET `/api/v1/matches/{matchId}/unlocks` - ดึงรายการข้อมูลที่ปลดล็อกแล้ว
- [ ] API: POST `/api/v1/matches/{matchId}/unlocks/{unlockType}` - ปลดล็อกข้อมูล (เมื่อถึงเกณฑ์)
- [ ] Intimacy score calculation (จาก activities และ messages)
- [ ] Unlock thresholds (Level 1: 20-30, Level 2: 40-50, Level 3: 60-70, Level 4: 80+)
- [ ] Unlock history tracking

### API Gateway Integration

- [ ] Request routing ไปยัง services ที่เหมาะสม
- [ ] Authentication และ authorization (JWT validation)
- [ ] Basic rate limiting
- [ ] Error handling และ response formatting

## Phase 3: Enhancement

- [ ] Edge case: จัดการการจับคู่ซ้ำซ้อน (UNIQUE constraint)
- [ ] Edge case: จัดการสถานะกิจกรรมเมื่อผู้ใช้ยกเลิกการจับคู่
- [ ] Edge case: Timeout mechanism สำหรับกิจกรรมที่ไม่ได้ทำต่อ
- [ ] Performance: เพิ่ม caching สำหรับ compatibility scores
- [ ] Performance: Optimize database queries (indexes)
- [ ] Security: Rate limiting สำหรับ sensitive endpoints
- [ ] Security: Input validation และ sanitization
- [ ] Error handling: Comprehensive error messages และ logging

## Phase 4: Finalization

- [ ] Code cleanup และ refactoring
- [ ] API documentation (Swagger/OpenAPI)
- [ ] README.md สำหรับการ setup และ run
- [ ] Environment variables documentation
- [ ] Basic testing (unit tests สำหรับ core logic)
- [ ] Deployment preparation (Dockerfiles, docker-compose)

## Out of Scope (ไม่ทำในรอบนี้)

- [ ] Date Planning Service (Phase 2 ตาม SDD)
- [ ] Payment Service และ subscription management (Phase 2 ตาม SDD)
- [ ] Video/Audio Call integration (Phase 2 ตาม SDD)
- [ ] File Storage integration (AWS S3) - ใช้ local storage หรือ mock
- [ ] Push Notification Service - ใช้ WebSocket แทน
- [ ] Message Queue (RabbitMQ/AWS SQS) - ใช้ synchronous processing
- [ ] Advanced matching algorithm (collaborative filtering)
- [ ] Admin Dashboard
- [ ] Mobile App (React Native/Flutter) - ใช้ Web API เท่านั้น
- [ ] Integration กับร้านอาหาร/คาเฟ่
- [ ] Analytics และ recommendations
