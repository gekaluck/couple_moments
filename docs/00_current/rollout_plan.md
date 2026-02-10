# Duet Rollout Plan

Updated: 2026-02-10
Status: Active - deployment readiness and repo cleanup

---

## Completed milestones

## P0 - Critical fixes (done)

| Item | Summary |
|------|---------|
| P0-1 | Authorization checks on mutation paths |
| P0-2 | Revert idea status on event deletion |
| P0-3 | Middleware auth guard |
| P0-4 | ICS Content-Disposition sanitization |

## P1 - Robustness (done)

| Item | Summary |
|------|---------|
| P1-1 | Zod validation on API route inputs |
| P1-2 | Per-user ratings model |
| P1-3 | Auth endpoint rate limiting |
| P1-4 | Comment deletion on event and idea detail pages |

## M4 - Google Calendar integration (phase 1 + 2 done)

Inbound availability:
- [x] OAuth flow, token encryption, free/busy sync
- [x] Calendar selection UI
- [x] Busy-block rendering on calendar

Outbound events:
- [x] Event creation to Google Calendar
- [x] "Add to Google Calendar" toggle on event creation
- [x] "Add to Google Calendar" toggle on idea scheduling
- [x] Sync status indicator on event detail

Future follow-ups:
- [ ] Automatic periodic sync
- [ ] Update/delete sync on event edits/deletes
- [ ] Additional provider support

---

## Current milestones

## M1 - Production deployment

- [ ] Provision production PostgreSQL
- [ ] Configure required env vars
- [ ] Run `npx prisma migrate deploy`
- [ ] Deploy app runtime
- [ ] Verify auth, space setup, event CRUD, and calendar load
- [ ] Configure domain and HTTPS

Reference: `docs/00_current/DEPLOYMENT.md`

## M2 - Photo upload hardening

- [x] Event detail photo upload flow wired
- [x] Photo persistence and gallery display
- [x] URL fallback path implemented
- [ ] Add stricter file size/type guardrails
- [ ] Add clearer upload failure recovery states

## M3 - UX polish backlog

- [x] Empty-state messaging for sparse spaces
- [x] Planning simplification (remove low-value tag/today filters)
- [x] Calendar visual density improvements
- [ ] Loading skeletons for key surfaces
- [ ] Error boundaries for primary pages
- [ ] Additional accessibility and keyboard pass

## M5 - Repository cleanup and refactor (in progress)

Tracked in: `docs/00_current/CLEANUP_PLAN.md`

Phase status:
- [x] Phase 0: stabilize and commit pending cleanup diff
- [x] Phase 1: dead code and CSS sweep
- [x] Phase 2: docs source-of-truth alignment
- [x] Phase 3: API auth/validation helper consolidation
- [x] Phase 4: page decomposition and data-loader refactor
- [x] Phase 5: schema/dependency governance

---

## Deferred backlog

| Item | Why deferred |
|------|--------------|
| EventType runtime reconciliation | Low immediate impact |
| Full test infrastructure | Not blocking private two-user rollout |
| CSRF hardening expansion | Current threat profile low for private MVP |
| Invite code rotation/expiration | Space member cap limits exposure |
| Full accessibility audit | Needs focused dedicated pass |

---

## Definition of done per milestone

- Build passes: `npm run build`
- Lint passes: `npm run lint`
- Typecheck passes: `npx tsc --noEmit`
- Relevant docs updated
- Changes reviewed and merged
