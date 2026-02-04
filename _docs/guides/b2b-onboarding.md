# B2B Merchant Onboarding Guide

## Overview

PlayMyDate B2B Portal ช่วยให้ merchants สามารถสร้าง campaigns, quests, และจัดการ venues เพื่อเข้าถึงผู้ใช้ PlayMyDate

---

## Getting Started

### 1. Account Setup

1. ติดต่อทีม PlayMyDate เพื่อสร้าง merchant account
2. รับ credentials (email + temporary password)
3. Login ที่ `/b2b/login`
4. เปลี่ยนรหัสผ่าน (แนะนำ)

### 2. Dashboard Overview

หลัง login จะเข้าสู่ Dashboard ที่แสดง:
- **Campaign Metrics**: จำนวน campaigns และ status
- **Performance Overview**: impressions, clicks, conversions
- **Quick Actions**: สร้าง campaign ใหม่

---

## Creating Your First Campaign

### Step 1: Navigate to Campaigns

1. คลิก "Campaigns" ในเมนู sidebar
2. คลิกปุ่ม "Create Campaign"

### Step 2: Configure Campaign

| Field | Description | Example |
|-------|-------------|---------|
| Name | ชื่อ campaign | "Valentine's Day Promo" |
| Type | ประเภท campaign | brand_awareness, engagement, conversion |
| Budget | งบประมาณ (THB) | 50000 |
| Start Date | วันเริ่มต้น | 2026-02-01 |
| End Date | วันสิ้นสุด | 2026-02-28 |

### Step 3: Define Target Audience

กำหนด target audience:
```json
{
  "ageRange": { "min": 25, "max": 40 },
  "personas": ["connector", "achiever"],
  "subscriptionTiers": ["plus", "premium"]
}
```

### Step 4: Set Pricing

- **CPA Rate**: Cost per action (conversion)
- **CPMI Rate**: Cost per thousand impressions

### Step 5: Publish

1. Review ข้อมูลทั้งหมด
2. คลิก "Create Campaign"
3. Campaign จะอยู่ใน status "draft"
4. คลิก "Activate" เพื่อเริ่ม campaign

---

## Creating Branded Quests

Branded Quests คือ activities พิเศษที่ sponsor โดย merchant

### Step 1: Navigate to Quests

1. คลิก "Quests" ในเมนู sidebar
2. คลิก "Create Quest"

### Step 2: Configure Quest

| Field | Description |
|-------|-------------|
| Campaign | เลือก campaign ที่จะ link |
| Activity | เลือก activity type |
| Name | ชื่อ quest |
| Description | รายละเอียด |
| Instructions | คำแนะนำการทำ quest |
| Coin Reward | จำนวน PlayCoins ที่ได้รับ |
| Max Completions | จำกัดจำนวนครั้งที่ทำได้ |

### Step 3: Activate

Quest จะ active ตาม campaign ที่เลือก

---

## Managing Venues

สำหรับ merchants ที่มี physical venues

### Adding a Venue

1. ไปที่ "Venues"
2. คลิก "Add Venue"
3. กรอกข้อมูล:
   - Name, Address
   - Venue Type (restaurant, cafe, bar, etc.)
   - Price Range (1-5)
   - Cuisine Type
   - Opening Hours
   - Photos

### Enabling Bookings

1. เปิด "Booking Enabled"
2. Users สามารถจองผ่าน Paradise Mode

### QR Check-in

1. สร้าง QR code สำหรับ venue
2. Users scan เพื่อ check-in และรับ PlayCoins

---

## Analytics Dashboard

### Overview Metrics

- **Total Impressions**: จำนวนครั้งที่ campaign แสดง
- **Total Clicks**: จำนวนคลิก
- **Total Conversions**: จำนวน conversions
- **CTR**: Click-through rate
- **Conversion Rate**: อัตราการ convert

### Conversion Funnel

แสดง user journey:
```
Impressions → Clicks → Engagements → Conversions
```

พร้อม dropoff rates แต่ละ step

### Audience Insights

วิเคราะห์ผู้ใช้ตาม:
- Persona Types (explorer, connector, achiever, etc.)
- Engagement Scores
- Segment Distribution

### Generating Reports

1. ไปที่ Analytics
2. คลิก "Generate Report"
3. เลือก Report Type:
   - Overview: summary ทั้งหมด
   - Audience: audience breakdown
   - Campaigns: performance per campaign
4. เลือก Period (7d, 30d, 90d)
5. Download report

---

## Billing

### Invoice Management

- ดู invoices ที่ "Billing"
- Filter by status: pending, paid, overdue
- Download PDF invoice

### Usage Tracking

ดูการใช้งาน real-time:
- Daily impressions
- Daily clicks
- Daily spend

---

## API Integration (Advanced)

สำหรับ merchants ที่ต้องการ integrate ผ่าน API

### API Key

1. ไปที่ "Settings"
2. Generate API Key
3. ใช้ API key ใน header: `X-API-Key: your-api-key`

### Endpoints

ดู API documentation ที่ `/_docs/api/openapi.yaml`

---

## Support

- Email: b2b-support@playmydate.com
- Documentation: `/docs`
- Status Page: `/status`
