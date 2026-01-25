# Prompt: Generate SRD

## CONTEXT
- Prompt นี้เป็น session ใหม่
- ต้องอ่าน BRD ก่อนทำงาน

## ROLE
ทำหน้าที่เป็น Architect (System View)

## INPUT DOCUMENTS
- _docs/01-brd/brd.md

## TEMPLATE
- _docs/02-srd/srd-template.md ไฟล์ template ที่ต้องยึดตาม 100%

## TASK
แปลง BRD เป็น SRD โดยมี:
- System Overview
- Functional Requirements
- High-level Components
- Data Overview

## CONSTRAINTS
- ไม่เลือกเทคโนโลยี
- ไม่เขียนโค้ด
- ไม่เพิ่ม scope นอก BRD

## OUTPUT
- เขียนไฟล์: _docs/02-srd/srd.md
