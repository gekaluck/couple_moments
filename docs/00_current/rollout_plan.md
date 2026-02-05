# Couple Moments — Rollout Plan

**Updated:** 2026-02-04
**Status:** P0/P1 complete — moving to deployment and polish

---

## Completed Milestones

### P0 — Critical Fixes (Done)

| Item | Summary |
|------|---------|
| P0-1 | Authorization checks on all mutation functions |
| P0-2 | Revert idea status on event deletion |
| P0-3 | Middleware auth guard |
| P0-4 | Sanitize ICS Content-Disposition header |

### P1 — Robustness (Done)

| Item | Summary |
|------|---------|
| P1-1 | Zod validation on API route inputs |
| P1-2 | Per-user ratings (Rating model) |
| P1-3 | Rate limiting on auth endpoints |
| P1-4 | Comment deletion on event/idea detail pages |

Full evaluation details archived in `docs/90_archive/release-2026-02-04/EVALUATION_SUMMARY.md`.

---

## Current Milestone

### M1. Deployment — Hosting + DB + Env Vars

Get the app running in production for two real users.

- [ ] Provision PostgreSQL (Railway / Neon / Supabase)
- [ ] Configure production environment variables (`DATABASE_URL`, session secret, Cloudinary keys)
- [ ] Run `prisma migrate deploy` against production DB
- [ ] Deploy Next.js app (Railway / Vercel / Fly.io)
- [ ] Verify auth flow, space creation, and event CRUD on production
- [ ] Set up domain / HTTPS

See `docs/00_current/DEPLOYMENT.md` for platform options and step-by-step instructions.

### M2. Photo Upload MVP

Replace Cloudinary placeholder with working upload flow.

- [ ] Confirm Cloudinary unsigned preset is configured and env vars are set
- [ ] Wire up photo upload on event detail page (client-side upload → save URL)
- [ ] Display uploaded photos in event detail and memories views
- [ ] Add basic file-size and type validation on the client

### M3. UX Polish Round 2

Improvements surfaced during evaluation — do after deployment is stable.

- [x] Add empty-state messaging for spaces with no events/ideas
- [ ] Add loading skeletons for calendar, event list, and idea list pages
- [ ] Add inline form validation feedback (client-side, complementing Zod on server)
- [x] Standardize card layouts across event and idea lists (Button.tsx, Card standardization)
- [ ] Add error boundaries for core pages
- [x] Tighten form feedback (loading spinners on submit buttons)
- [x] Extract DayCell component from calendar
- [x] Redesign EventBubble for cleaner visual density
- [x] Remove tag filter from planning section

### M4. Google Calendar Integration (In Review)

Sync busy/free time from external calendars.

- [x] OAuth2 flow with Google Calendar API
- [x] Encrypted token storage (AES-256-GCM)
- [x] Sync FreeBusy data from selected calendars
- [x] Display external busy blocks with time ranges
- [x] Color-coded blocks per user
- [x] Settings UI for managing connected calendars
- [ ] Automatic periodic sync (cron/webhook)
- [ ] Support for additional calendar providers

See `docs/00_current/TECH_PLAN_GOOGLE_CALENDAR.md` for implementation details.

**Environment variables required:**
- `TOKEN_ENCRYPTION_KEY` — 32-byte base64 key for token encryption
- `GOOGLE_CLIENT_ID` — OAuth client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — OAuth client secret
- `GOOGLE_REDIRECT_URI` — Callback URL for OAuth flow

---

## Remaining Backlog

### P1-5. Cascade deletes for space-owned entities

Configure `onDelete: Cascade` from `CoupleSpace` to `Event`, `Idea`, `Note`, `AvailabilityBlock` and from `Event` to `Photo`, `Notification`. Low urgency — application-level cleanup covers this today.

### P2 — Deferred Items

| Item | Why defer |
|------|-----------|
| Reconcile EventType enum with runtime date logic | Nothing reads `type` after creation |
| Test infrastructure | Not blocking launch for 2 users |
| CSRF tokens on API routes | SameSite=lax + server actions cover main vectors |
| Password strength policy | Low-impact for invite-only app |
| Invite code rotation/expiration | 2-member cap limits damage |
| Accessibility audit | Schedule as a dedicated pass |

### Tech Debt

- Scheduled cleanup for expired sessions
- Type-safe env validation
- CI/CD pipeline baseline

---

## Definition of Done

- `npm run build` passes
- Smoke test checklist complete
- Docs updated
- Changes reviewed and merged
