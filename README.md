# SarkariRank — Govt Exam Prep Platform

Testbook-style exam preparation app with React Native mobile app + Next.js admin dashboard + Convex backend.

## Structure

```
sarkari-rank/
├── app/       → Expo React Native (iOS/Android)
└── backend/   → Next.js Admin + Convex API (deploy to Vercel)
```

## Deploy Admin to Vercel

1. Import this repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `backend`
3. Add environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` = `https://hardy-leopard-835.convex.cloud`
   - `ADMIN_SECRET` = your admin secret (optional)
4. Deploy

## Local Development

**Admin:**
```bash
cd backend && npm install && npm run dev:web
# http://localhost:3000/admin/login
# admin@sarkarirank.com / admin123
```

**Mobile:**
```bash
cd app && npm install && npx expo start
```

**Seed data:** Admin Dashboard → Basic Seed → Load 55+ Tests

## Convex

Backend URL: `https://hardy-leopard-835.convex.cloud`

Deploy Convex functions:
```bash
cd backend && npx convex deploy
```
