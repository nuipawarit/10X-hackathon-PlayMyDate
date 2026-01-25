# Prompt: Generate SDD

## CONTEXT
- Prompt นี้เป็น session ใหม่
- ต้องอ่าน SRD ก่อนทำงาน

## ROLE
ทำหน้าที่เป็น Architect (Implementation Ready)

## INPUT DOCUMENTS
- _docs/02-srd/srd.md

## TEMPLATE
- _docs/03-sdd/sdd-template.md ไฟล์ template ที่ต้องยึดตาม 100%

## TASK
สร้าง SDD ที่มี:
- Architecture Overview
- Component Responsibilities
- Draft API / Interfaces
- Draft Data Model

## CONSTRAINTS
- ยังไม่เขียน production code
- ไม่ optimize ลึกเกินจำเป็น

## OUTPUT
- เขียนไฟล์: _docs/03-sdd/sdd.md
