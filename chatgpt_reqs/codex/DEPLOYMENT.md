# Deployment Guide - Couple Moments

## Current State
- **Database**: PostgreSQL (via `@prisma/adapter-pg`)
- **Auth**: Signed session tokens (stateless, production-ready)
- **Framework**: Next.js 16 with App Router

> **Note**: The app has been migrated from SQLite to PostgreSQL. You need a PostgreSQL database to run it.

## Recommended Stack for Production

### Option A: Railway (Easiest for your setup)
**Why**: One-click PostgreSQL + automatic Next.js deployment. $5/month for hobby tier.

### Option B: Vercel + Neon/Supabase
**Why**: Best for Next.js, but requires external DB. Vercel free tier generous.

### Option C: Fly.io
**Why**: Cheapest for always-on apps, but more manual setup.

---

## Step-by-Step: Railway Deployment

### 1. Migrate from SQLite to PostgreSQL

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Remove SQLite-specific dependencies:
```bash
npm uninstall @prisma/adapter-better-sqlite3 better-sqlite3
```

Update `src/lib/prisma.ts` to remove the SQLite adapter:
```typescript
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 2. Fix Session Storage (Critical)

Currently sessions are stored in-memory. For production, add a session table:

Add to `prisma/schema.prisma`:
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Update `src/lib/sessions.ts` to use database sessions instead of in-memory Map.

### 3. Set Up Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Create new project → "Deploy from GitHub repo"
3. Select your repository
4. Add a PostgreSQL database (click "+ New" → "Database" → "PostgreSQL")
5. Railway auto-detects Next.js and sets up build

### 4. Environment Variables

Set these in Railway dashboard:

```
DATABASE_URL=<auto-filled by Railway when you link PostgreSQL>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your key>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your cloud name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your preset>
```

### 5. Database Migration

After deployment, run in Railway terminal:
```bash
npx prisma migrate deploy
```

Or set build command to:
```bash
npx prisma migrate deploy && npm run build
```

### 6. Custom Domain (Optional)

1. In Railway, go to Settings → Domains
2. Add custom domain (e.g., `couplemoments.yourdomain.com`)
3. Update DNS records as instructed

---

## Quick Checklist

- [ ] Switch Prisma from SQLite to PostgreSQL
- [ ] Remove better-sqlite3 dependencies
- [ ] Update prisma.ts to remove SQLite adapter
- [ ] Add database-backed sessions
- [ ] Create Railway account
- [ ] Deploy repo to Railway
- [ ] Add PostgreSQL database
- [ ] Set environment variables
- [ ] Run migrations
- [ ] Test with your girlfriend!

---

## Cost Estimate

**Railway Hobby Plan**: ~$5/month
- Includes: PostgreSQL, Next.js hosting, SSL, automatic deploys

**Vercel + Neon Free Tier**: $0-5/month
- Vercel: Free for hobby
- Neon: Free tier has 0.5GB storage

---

## After Deployment

1. **Create accounts**: You and your girlfriend register new accounts
2. **Create couple space**: One person creates space, shares invite code
3. **Start planning**: Add your first date!

---

## Troubleshooting

**Build fails with Prisma error**:
- Ensure `npx prisma generate` runs before build
- Add to package.json scripts: `"postinstall": "prisma generate"`

**Database connection fails**:
- Check DATABASE_URL is correctly set
- Ensure PostgreSQL addon is linked to your service

**Sessions not persisting**:
- Implement database sessions (see step 2)
- Check NEXTAUTH_SECRET is set
