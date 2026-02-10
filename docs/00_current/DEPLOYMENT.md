# Deployment Guide (Current)

Updated: 2026-02-10

## Scope

This guide covers production deployment for the current Duet stack:
- Next.js 16 (App Router)
- Prisma + PostgreSQL
- Cookie-based sessions (`cm_session`)
- Optional integrations: Google Calendar, Google Maps Places, Cloudinary uploads

## 1) Required environment variables

Minimum required:

```bash
DATABASE_URL=postgresql://...
```

Required if Google Calendar integration is enabled:

```bash
TOKEN_ENCRYPTION_KEY=base64-encoded-32-byte-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<your-domain>/api/integrations/google/callback
```

Required if Google Maps place search is enabled:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Required if Cloudinary photo upload is enabled:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

## 2) Build and migrate

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

Notes:
- `npm run build` already runs `prisma generate`.
- Run `prisma migrate deploy` before first production start.

## 3) Hosting options

## Option A: Railway (fastest setup)
- Provision Postgres in the same project.
- Set all env vars in Railway service settings.
- Deploy app service from repository.
- Run `npx prisma migrate deploy` once against production DB.

## Option B: Vercel + managed Postgres (Neon/Supabase)
- Configure DB separately.
- Add env vars in Vercel project settings.
- Run migrations via CI step or one-off job before release.

## Option C: Fly.io
- Works well for always-on Node runtime.
- Requires explicit process and release migration setup.

## 4) Release checklist

- [ ] Env vars configured for enabled features
- [ ] `npx prisma migrate deploy` executed successfully
- [ ] `npm run build` passes in production environment
- [ ] Login, register, logout work
- [ ] Space creation and membership checks work
- [ ] Calendar load and event create/edit/delete work
- [ ] If enabled: Google connect/sync and Cloudinary upload tested

## 5) Common issues

`PrismaClientInitializationError`:
- Check `DATABASE_URL` correctness and SSL requirements.

Google OAuth callback mismatch:
- Ensure `GOOGLE_REDIRECT_URI` exactly matches the callback URL configured in Google Cloud.

Cloudinary upload fails:
- Verify cloud name, preset, and preset upload permissions.
