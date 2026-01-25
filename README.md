# Project Specification Repository
Repo นี้ใช้สำหรับ:
- คิดงาน
- เขียนเอกสาร
- ใช้ Cursor (AI) ช่วยออกแบบและพัฒนา

## Workflow (สำคัญ)
1. เขียน BRD (ภาษาคน)
2. แปลงเป็น SRD (System View)
3. แปลงเป็น SDD (Design for Dev / AI)
4. ใช้ SDD เป็น input ในการ implement

> เอกสารใน `_docs/` คือ Source of Truth
> ห้าม implement ก่อนเอกสาร

## AI Usage
โปรเจคนี้ใช้ AI โดยยึดตามมาตรฐานใน:
_docs/ai/ai-all-prompt-templates.md

## AI Prompt Cards
Prompt สำหรับใช้งานระหว่าง workshop และ hackathon:
- _docs/ai/prompt-cards/

## 🧭 How to Use This Repo (Workshop)
1. อ่าน:
  - _docs/ai/AI-DOs-and-DONTs-1page.md
2. ระหว่างทำงาน:
  - ใช้ prompt จาก _docs/ai/prompt-cards/
3. ห้าม:
  - เขียนโค้ดก่อนมี SDD
  - เปลี่ยน template เอง
