# Couple Moments - Claude Context

## Overview
Relationship planning app for couples. Calendar-centric planning hub with events, ideas inbox, memories, and shared availability tracking.

## Tech Stack
```
Next.js 15+      App Router, Server Components, Server Actions
TypeScript       Strict mode
Tailwind CSS v4  Custom CSS variables in globals.css
SQLite           via better-sqlite3
Prisma v7        Custom output: src/generated/prisma/
Auth             Custom (bcrypt + session cookies)
UI               @headlessui/react, lucide-react
Maps             Google Maps JavaScript API
```

## Key Commands
```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npx prisma studio     # Database browser
npx prisma migrate dev # Run migrations
npx prisma generate   # Regenerate client
npx tsx scripts/seed-demo.ts <spaceId> --reset  # Seed demo data
```

## Project Structure
```
src/
├── app/                    # Pages (App Router)
│   ├── api/               # Auth endpoints only
│   ├── spaces/[spaceId]/  # Main app pages
│   │   ├── calendar/      # Primary hub (events + planning)
│   │   ├── memories/      # Past events timeline
│   │   ├── notes/         # Notes center
│   │   └── activity/      # Change log
│   ├── events/[eventId]/  # Event detail
│   └── login/, register/  # Auth pages
├── components/            # Reusable components
├── lib/                   # Server utilities (CRUD, auth, helpers)
└── generated/prisma/      # Generated Prisma client
```

## Data Model (11 tables)
- **User** → Membership → **CoupleSpace**
- **Event** (PLANNED/MEMORY) with places, tags, photos
- **Idea** (NEW/PLANNED/DONE) → converts to Event
- **AvailabilityBlock** - partner busy times
- **Note** - unified comments (MANUAL/EVENT_COMMENT/IDEA_COMMENT)
- **Reaction** - emoji reactions on Events/Notes
- **ChangeLogEntry** - activity audit trail

## Key Patterns

### Server Actions (preferred for mutations)
```typescript
async function handleCreate(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  // validate, create, redirect
}
```

### Auth enforcement
Every page starts with `await requireUserId()` - redirects to /login if no session.

### Tags stored as JSON string
```typescript
parseTags('["outdoor","food"]') → ['outdoor', 'food']
normalizeTags('outdoor, food') → '["outdoor","food"]'
```

### Modal state via URL params
`?new=2026-01-15` opens new event modal with date prefilled.

## Known Issues / Tech Debt
1. **Sessions in-memory** - lost on restart (need Redis/DB)
2. **No loading states** - forms feel unresponsive
3. **No error boundaries** - errors crash pages
4. **Photo upload not implemented** - schema exists, no routes
5. **Email notifications not implemented** - schema exists, no cron
6. **SQLite write contention** - migrate to PostgreSQL for production

## Priority Next Features
1. Toast notifications (sonner/react-hot-toast)
2. Loading states / optimistic UI
3. Photo upload (S3/Supabase)
4. Error boundaries
5. Confirmation dialogs before delete

## Design System
- Theme: Rose/pink gradient, glassmorphic surfaces
- CSS vars in `globals.css` (--accent-primary, --bg-primary, etc.)
- Fonts: Inter (sans), Playfair Display (display)
- Classes: `.surface`, `.pill-button`

## Full Context
See `PROJECT_CONTEXT.md` in repo root for complete architecture decisions, data model details, and roadmap.
