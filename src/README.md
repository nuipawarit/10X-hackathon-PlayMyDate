# PlayMyDate

A dating app that matches users through activities and progressive disclosure, not just photos.

## Features

- **Smart Matching**: Matches based on playing style and interests
- **Activities**: Break the ice with fun activities together
- **Progressive Disclosure**: Private info unlocks as intimacy grows
- **Real-time Chat**: WebSocket-powered messaging

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- PostgreSQL
- Redis
- Socket.io

**Frontend:**
- React + Vite
- Tailwind CSS
- Socket.io-client

## Quick Start

### 1. Start Database Services

```bash
cd src
docker-compose up -d
```

### 2. Setup Backend

```bash
cd src/backend
cp .env.example .env
npm install
npm run seed  # Seeds demo data
npm run dev
```

### 3. Setup Frontend

```bash
cd src/frontend
npm install
npm run dev
```

### 4. Open the App

Visit http://localhost:5173

**Demo Accounts:**
- alice@demo.com / password123
- bob@demo.com / password123
- charlie@demo.com / password123

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me/profile` - Update public profile
- `PUT /api/v1/users/me/private-data` - Update private data

### Matches
- `GET /api/v1/matches/me` - Get my matches
- `POST /api/v1/matches/find` - Find new matches
- `GET /api/v1/matches/:matchId` - Get match details
- `POST /api/v1/matches/:matchId/unmatch` - Unmatch

### Activities
- `GET /api/v1/activities/match/:matchId` - Available activities
- `POST /api/v1/activities/match/:matchId/start/:activityId` - Start activity
- `POST /api/v1/activities/instance/:instanceId/complete` - Complete activity

### Intimacy
- `GET /api/v1/intimacy/match/:matchId` - Get intimacy level
- `GET /api/v1/intimacy/match/:matchId/unlocks` - Get unlocks
- `POST /api/v1/intimacy/match/:matchId/unlock/:type` - Unlock data

### Messages
- `GET /api/v1/messages/match/:matchId` - Get messages
- `POST /api/v1/messages/match/:matchId` - Send message

### WebSocket Events
- `join_match` - Join match room
- `send_message` - Send message
- `new_message` - Receive message
- `typing` / `stop_typing` - Typing indicators

## Intimacy Levels

| Level | Score | Unlocks |
|-------|-------|---------|
| 0 | 0-24 | Nothing |
| 1 | 25+ | Real Name |
| 2 | 45+ | Photo |
| 3 | 65+ | Occupation |
| 4 | 85+ | Voice/Video Call |

## Project Structure

```
src/
├── backend/
│   └── src/
│       ├── api/           # Express server
│       ├── modules/       # Domain modules
│       │   ├── user/
│       │   ├── matching/
│       │   ├── activity/
│       │   ├── communication/
│       │   └── intimacy/
│       └── shared/        # Shared utilities
├── frontend/
│   └── src/
│       ├── pages/         # React pages
│       ├── components/    # Shared components
│       ├── services/      # API client
│       └── context/       # React context
├── database/
│   ├── migrations/
│   └── seeds/
└── docker-compose.yml
```

## Development

```bash
# Backend
cd src/backend && npm run dev

# Frontend
cd src/frontend && npm run dev

# Reset database
docker-compose down -v
docker-compose up -d
npm run seed
```
