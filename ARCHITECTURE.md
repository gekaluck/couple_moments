# Architecture - Couple Moments

## Overview
Couple Moments is a Next.js 16 application built with the App Router. It uses
server components and server actions for most data mutations, Prisma + PostgreSQL
for persistence, and a session cookie with database-backed tokens for auth.

Primary goals:
- Fast, low-latency user experience for planning and memories.
- Simple, maintainable server-side data flows.
- Clear separation between UI components and data access logic.

## System Context
- Web client: Next.js App Router (React 19).
- Backend: Next.js server runtime (API routes + server actions).
- Database: PostgreSQL (Prisma with `@prisma/adapter-pg` + `pg`).
- External services:
  - Google Maps Places (search + place metadata).
  - Cloudinary (photo uploads).

## High-Level Architecture
```
Browser
  -> Next.js App Router (Server Components)
    -> Server Actions / API Routes
      -> Prisma Client (PostgreSQL)
  -> Client Components
    -> UI/UX feedback (toasts, modals, optimistic updates)
```

## Code Structure
```
src/
  app/                         # App Router routes and layouts
  components/                  # UI and feature components
  lib/                         # Data access + business helpers
prisma/                        # Prisma schema + migrations
scripts/                       # Dev/seed scripts
public/                        # Static assets
```

### App Layer (Routes)
- `src/app/layout.tsx`: Global layout, fonts, Toaster.
- `src/app/spaces/[spaceId]/...`: Primary surfaces (calendar, notes, memories,
  activity, settings).
- `src/app/events/[eventId]/...`: Event detail, comments, ratings, photos.
- `src/app/api/...`: Auth, calendar export (ICS), and couple-space operations.

### Components
UI is composed from reusable building blocks under `src/components/`:
- UI primitives: buttons, badges, tag input, icon buttons, modals.
- Feature modules: planning cards, onboarding, photo uploader.
- Feedback helpers: toasts, confirm dialogs, loading states.

### Data & Domain Layer
`src/lib/` contains domain logic and Prisma queries:
- Auth & session handling: `auth.ts`, `session.ts`, `current-user.ts`.
- Core domains: `events.ts`, `ideas.ts`, `notes.ts`, `availability.ts`,
  `couple-spaces.ts`, `activity.ts`, `change-log.ts`.
- Utilities: `calendar.ts`, `tags.ts`, `formatters.ts`, `ical.ts`.

## Data Model (Prisma)
Key entities (see `prisma/schema.prisma`):
- `User` and `Session` (token-based auth, DB-backed).
- `CoupleSpace`, `Membership` (multi-user spaces).
- `Event`, `Idea`, `Note`, `AvailabilityBlock`, `Photo`.
- `ChangeLogEntry`, `Notification` (auditing and reminders).

Indexes are added on high-traffic fields to support list views.

## Auth & Sessions
- Login/Register: API routes create a session token stored in `Session` table.
- Session token stored in HTTP-only cookie `cm_session`.
- Server-side checks use `requireUserId()` to enforce auth.
- Logout deletes the session row and clears the cookie.
- Expired sessions are cleaned up on read; add a scheduled cleanup if needed.

## Core Flows

### Event Creation
1) UI form in calendar or plan modal collects data.
2) Server action validates input and calls `createEventForSpace`.
3) User redirected or refreshed, toast confirms success.

### Idea -> Event Scheduling
1) User schedules an idea from the planning column.
2) Server action reuses idea data to create a planned event.
3) UI refreshes and shows the new plan.

### Notes
1) Notes page uses server actions for create/delete.
2) Activity and notes list views are server-rendered.

### Photo Uploads
1) Client uploads to Cloudinary with unsigned preset.
2) App stores the resulting URL in `Photo`.

## Integrations
- Google Maps Places: `PlaceSearch` client component uses public API key.
- Calendar export: `/api/spaces/[spaceId]/calendar.ics` generates ICS content.
- Cloudinary uploads: `PhotoUploader` posts to Cloudinary and stores URLs.

## UI/UX Architecture
- Tailwind CSS + CSS variables in `globals.css` for tokens.
- `surface` and `surface-muted` containers define elevation and tone.
- Shared animations for page transitions and staggered list entries.

## Deployment & Runtime
- Next.js server runtime (Node).
- PostgreSQL required (Neon, Railway, or local).
- `prisma generate` runs on install; migrations stored in `prisma/migrations`.
- See `DEPLOYMENT.md` for environment variables and hosting options.

## Local Development
```
npm install
npm run dev
```
Required environment variables:
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

## Operational Notes
- Session cleanup for expired sessions should be scheduled if needed.
- Large data sets may require further indexing or pagination.
- Cloudinary uploads rely on unsigned presets; lock them down to your domain.

## Known Risks / TODO
- Add automated tests for auth and server actions.
- Implement email reminders (schema exists, job not implemented).
- Consider rate limiting and audit logging for critical actions.
