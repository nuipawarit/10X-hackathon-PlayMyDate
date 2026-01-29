# PlayMyDate

Dating app ที่ match users ผ่าน activities และ progressive disclosure

## Production

- **URL**: https://frontend-three-tau-40.vercel.app
- **Demo**: alice@demo.com / password123

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL + RLS
- **Auth**: Supabase Auth
- **Hosting**: Vercel

## Quick Start

### Local Development

```bash
cd src/frontend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

### Deploy to Vercel

```bash
cd src/frontend
vercel --prod
```

## Project Structure

```
src/frontend/
├── src/
│   ├── pages/           # React pages
│   ├── components/      # Shared components
│   ├── services/api.ts  # Supabase API calls
│   ├── context/         # Auth context
│   └── lib/supabase.ts  # Supabase client

supabase/
├── migrations/          # Database schema
├── functions/           # Edge Functions
│   ├── match-find/
│   ├── match-unmatch/
│   ├── activity-start/
│   ├── activity-complete/
│   └── intimacy-unlock/
└── config.toml
```

## Supabase Setup (New Project)

1. สร้าง project ที่ supabase.com
2. Link project: `supabase link --project-ref <ref>`
3. Push migrations: `supabase db push`
4. Deploy functions: `supabase functions deploy`
5. Create demo users: invoke `seed-demo-users` function

## Intimacy Levels

| Level | Score | Unlocks |
|-------|-------|---------|
| 0 | 0-24 | Nothing |
| 1 | 25+ | Real Name |
| 2 | 45+ | Photo |
| 3 | 65+ | Occupation |
| 4 | 85+ | Voice/Video |
