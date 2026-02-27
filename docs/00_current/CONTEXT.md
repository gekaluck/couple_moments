# Context

## Commands
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build (includes prisma generate)
npm run lint             # ESLint
npx tsc --noEmit         # Type check
npm run db:migrate       # prisma migrate dev
npm run db:push          # prisma db push
npm run db:studio        # Prisma Studio
npx tsx scripts/seed-demo.ts <spaceId> --reset  # Seed demo data
```

## How to run / test / migrate / seed
- Local run: `npm run dev`
- Build check: `npm run build`
- Lint check: `npm run lint`
- Type check: `npx tsc --noEmit`
- Migrations (dev): `npm run db:migrate`
- Seed data: `npx tsx scripts/seed-demo.ts <spaceId> --reset`

## Repo map
```text
src/
  app/                             # App Router routes and layouts
    api/                           # Auth, spaces/events/ideas, integrations, ICS export
    spaces/[spaceId]/              # Main product surfaces
      calendar/                    # Primary hub (events, ideas, busy blocks)
      memories/                    # Past events and memory timeline
      notes/                       # Shared notes
      activity/                    # Change log / activity feed
      settings/                    # Space settings + Google calendar settings
      planning/                    # Legacy route redirects to calendar
    events/[eventId]/              # Event detail (comments, ratings, photos)
    login/, register/              # Auth pages
  components/                      # UI and feature components
  lib/                             # Domain logic, auth/session, integrations, helpers
prisma/                            # Schema and migrations
scripts/                           # Utility scripts
docs/00_current/                   # Active docs
docs/90_archive/                   # Historical docs
```

## Conventions
- Prefer server actions for page-scoped mutations.
- Keep shared domain logic in `src/lib/*`.
- Modal state is URL-driven where applicable (for deep-linkable flows).
- Tags are stored as JSON strings and parsed with shared helpers.
- Keep docs concise and update them when behavior or scope changes.

## Do / do not
- Do keep changes focused and reviewable.
- Do update `rollout_plan.md` when milestone status changes.
- Do update `ARCHITECTURE.md` for boundary/integration changes.
- Do not ship large unrelated refactors in feature-only commits.

## Links
- `docs/00_current/READ_THIS_FIRST.md`
- `docs/00_current/ARCHITECTURE.md`
- `docs/00_current/DECISIONS.md`
- `docs/00_current/rollout_plan.md`
- `docs/00_current/PRE_RELEASE_USABILITY_TECH_PLAN.md`
