# Deployment Guide - Couple Moments

## Current State
- Database: PostgreSQL (Prisma + `@prisma/adapter-pg` + `pg`)
- Auth: DB-backed session tokens stored in `Session` table
- Framework: Next.js 16 with App Router

## Recommended Stack for Production

### Option A: Railway (Easiest for your setup)
**Why**: One-click PostgreSQL + automatic Next.js deployment.

### Option B: Vercel + Neon/Supabase
**Why**: Best for Next.js, but requires external DB.

### Option C: Fly.io
**Why**: Low-cost always-on apps, but more manual setup.

---

## Step-by-Step: Railway Deployment

### 1) Create a PostgreSQL database
- Create a Railway project and add a PostgreSQL service.
- Copy the `DATABASE_URL` (use `?sslmode=require` if needed).

### 2) Set environment variables
Set these in Railway dashboard:
```
DATABASE_URL=<postgres connection string>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<optional>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<optional>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<optional>
```

### 3) Run migrations
After deployment, run:
```bash
npx prisma migrate deploy
```

### 4) Build and start
The build script already runs `prisma generate`:
```bash
npm run build
```

If you want migrations in build:
```bash
npx prisma migrate deploy && npm run build
```

---

## Quick Checklist
- [ ] PostgreSQL database provisioned
- [ ] `DATABASE_URL` set in environment
- [ ] Migrations deployed (`prisma migrate deploy`)
- [ ] Build succeeds (`npm run build`)
- [ ] Optional: Google Maps + Cloudinary env vars

---

## Troubleshooting

**Prisma connection fails**:
- Verify `DATABASE_URL` is correct and includes SSL if required by host.
- Check that the database allows connections from your deploy host.

**Migrations fail**:
- Ensure the schema matches your migrations.
- Try `npx prisma migrate deploy` from the provider's console.

**Cloudinary uploads fail**:
- Confirm unsigned preset name and cloud name.
- Verify the preset allows uploads from your domain.
