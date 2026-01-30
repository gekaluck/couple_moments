# Context

## Commands
```bash
npm run dev            # Start dev server (localhost:3000)
npm run build          # Production build
npx prisma studio      # Database browser
npx prisma migrate dev # Run migrations
npx prisma generate    # Regenerate client
npx tsx scripts/seed-demo.ts <spaceId> --reset # Seed demo data
```

## How To Run / Test / Migrate / Seed
- Run locally: `npm run dev`
- Production build check: `npm run build`
- Migrations (dev): `npx prisma migrate dev`
- Schema sync (dev): `npx prisma db push`
- Seed demo data: `npx tsx scripts/seed-demo.ts <spaceId> --reset`
- Manual test checklist: `docs/00_current/rollout_plan.md`

## Repo Map
```
src/
  app/                    # Pages (App Router)
    api/                  # Auth endpoints only
    spaces/[spaceId]/     # Main app pages
      calendar/           # Primary hub (events + planning)
      memories/           # Past events timeline
      notes/              # Notes center
      activity/           # Change log
    events/[eventId]/     # Event detail
    login/, register/     # Auth pages
  components/             # Reusable components
  lib/                    # Server utilities (CRUD, auth, helpers)
  generated/prisma/       # Generated Prisma client
```

## Conventions
- Prefer server actions for mutations ("use server").
- Modals are opened via URL params (e.g., `?new=YYYY-MM-DD`).
- Tag helpers normalize/parse JSON-string tags.

## Coding Patterns (Operational)
- Keep server actions close to the page using them.
- Use helpers in `lib/` for DB access.
- Keep UI components small and reusable.

## Do / Don't
- Do keep docs concise and factual.
- Do record decisions in `docs/00_current/DECISIONS.md` or `/docs/20_adrs/`.
- Do update `docs/00_current/rollout_plan.md` when milestone scope changes.
- Don't invent architecture or product details not documented.
- Don't add large, unrelated changes without a clear rationale.

## When To Update Docs
- Update ARCHITECTURE.md only when boundaries, data flow, or integrations change.
- Update CONTEXT.md when commands, structure, or conventions change.
- Update rollout_plan.md when execution scope or status changes.

## Links
- docs/00_current/ARCHITECTURE.md
- docs/00_current/DECISIONS.md
- docs/00_current/rollout_plan.md
