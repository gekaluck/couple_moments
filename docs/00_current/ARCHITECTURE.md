# Architecture

## Overview
Duet is a Next.js 16 App Router application for two users to plan time together, track ideas, and preserve memories.

Core stack:
- Frontend/backend runtime: Next.js (server components + client components)
- Persistence: PostgreSQL via Prisma
- Auth: DB-backed session tokens (`cm_session` cookie)

## System context
- Web client: React 19 via Next.js App Router
- Server: Next.js route handlers + server actions
- Database: PostgreSQL (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- External integrations:
  - Google Maps Places (place search and metadata)
  - Cloudinary (photo uploads)
  - Google Calendar (availability sync + outbound event sync)

## High-level flow
```text
Browser
  -> Next.js routes/pages
    -> Server actions and API routes
      -> Prisma -> PostgreSQL

Client components
  -> interactive UI, local state, optimistic feedback
```

## Route surface
- `src/app/spaces/[spaceId]/*`
  - `calendar`: main planning surface (events, ideas, busy blocks)
  - `memories`: memory timeline and retrospection
  - `notes`: shared notes
  - `activity`: activity feed
  - `settings`: member/settings + Google calendar controls
  - `planning`: redirect route to `calendar`
- `src/app/events/[eventId]/*`: event detail, comments, ratings, photos
- `src/app/api/*`:
  - auth routes
  - couple-space, event, and idea API routes
  - Google integration routes
  - ICS export route

## Data/domain layer
Primary modules in `src/lib`:
- Auth/session: `auth.ts`, `session.ts`, `current-user.ts`
- Domain: `events.ts`, `ideas.ts`, `notes.ts`, `availability.ts`, `couple-spaces.ts`
- Activity/audit: `activity.ts`, `change-log.ts`
- Integrations/utilities: `ical.ts`, `tags.ts`, `formatters.ts`, `calendar.ts`, `request.ts`

## Data model highlights
Main entities:
- `User`, `Session`
- `CoupleSpace`, `Membership`
- `Event`, `Idea`, `Note`, `AvailabilityBlock`, `Photo`
- `ExternalAccount`, `ExternalCalendar`, `ExternalAvailabilityBlock`, `ExternalEventLink`
- `ChangeLogEntry`
- `Notification` (kept for planned future implementation)

## Key behavior patterns

### Auth enforcement
- Server pages call `requireUserId()` and redirect to `/login` when needed.
- API routes use `getSessionUserId()` checks.

### Event and idea lifecycle
- Ideas can be scheduled into events.
- Event detail handles comments, ratings, place metadata, and photos.

### Photo uploads
- Cloudinary upload path is supported when env vars are configured.
- URL-based photo add fallback is also supported.

### Calendar availability
- Manual availability and external busy blocks are rendered together.
- Google calendar busy sync is supported through selected calendars.

### Google outbound sync
- Event creation can optionally create a linked Google Calendar event.
- Sync status is shown on event detail when link metadata exists.

## Deployment/runtime notes
- Build script runs `prisma generate`.
- Production requires `DATABASE_URL`.
- Additional env vars are required only for enabled integrations.
- Deployment details and checklist are documented in `docs/00_current/DEPLOYMENT.md`.

## Current risks / technical debt
- Lint baseline has existing violations outside cleanup scope.
- Large page modules (`calendar/page.tsx`, `events/[eventId]/page.tsx`) need decomposition.
- API auth/validation patterns are still repetitive and targeted by cleanup phases.

## Related docs
- `docs/00_current/CONTEXT.md`
- `docs/00_current/DECISIONS.md`
- `docs/00_current/rollout_plan.md`
- `docs/00_current/PRE_RELEASE_USABILITY_TECH_PLAN.md`
- `docs/00_current/DEPLOYMENT.md`
