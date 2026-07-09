# Rollout Plan & Backlog

Updated: 2026-07-09

## Status

Private beta, live on Vercel with real usage. **The active delivery plan is `/REVIVAL_PLAN.md` (repo root)** — phases: hygiene → mobile bug squash → design pass → email invites/notifications. This file tracks the backlog ledger and completed-cycle history.

---

## Open items (owned by REVIVAL_PLAN.md phases)

| ID | Title | Owner phase |
|---|---|---|
| T-1 | Auth smoke tests (Playwright): register→onboarding, login ok/bad, logout | Phase 1.3 |
| T-2 | Core planning flow tests: create event/idea, schedule idea, delete event reverts idea | Phase 1.3 |
| T-3 | Playwright config + auth/seed helpers + CI step | Phase 1.3 |
| D-2 | Decompose `calendar/page.tsx` (859 lines, inline server actions → `actions.ts`) | Phase 1.5 |
| D-3 | Decompose `events/[eventId]/page.tsx` (806 lines, same approach) | Phase 1.5 |
| — | Activity search: mobile + full-history (server-side `?q=`); Memories year filter on mobile | Phase 2 sweep / deferred |
| — | Infinite scroll for Activity/Memories | Deferred |

---

## Completed cycles

### February 2026 cycle (details: `docs/90_archive/rollout_plan.md` era)
All P0 blockers (password reset, calendar empty state, silent action failures, partner-note delete affordance), all P1 UX items (U-1..U-4, U-6, U-7), landing page, CI blocking lint/type-check, Vercel config, dev.db removal, SESSION_SECRET cleanup. **U-5 (activity filters)** was delivered by the June Activity redesign.

### June 2026 cycle (details: `docs/90_archive/IMPLEMENTATION_PLAN_2026-06.md`)
- Mobile Wins plan fully shipped (Activity row redesign, Memories cards, What's-ahead rails, Settings) — PRs #38–#40.
- Audit quick wins (PR #40): schedule-idea timezone bug (F1), Maps script removal (F3), login rate limiting + password minimum (F5), contrast tokens (F6), orphan file deletion (F9), source-string mismatch (F11), stale-closure fix (F12), PlaceSearch error handling (F14), typo/touch-target fixes (F20 partial).
- Shared event-form parsing extracted to `src/lib/event-form.ts` (D-1 from this ledger — done).
- Mobile calendar redesign: agenda + collapsible month strip, day-tap filtering; idea detail page; cards as pure tap targets (`feat/whats-ahead-redesign`, pending merge).

### Deferred ledger

| Item | Note |
|---|---|
| Email / push notifications | **Now in scope** — REVIVAL_PLAN Phase 4 (email invites + `.ics`, magic-link auth, preferences) |
| Multi-timezone support | Space-level IANA timezone decision scheduled in REVIVAL_PLAN Phase 4.3 |
| Per-user calendar preferences in DB | Cookie-based prefs still acceptable |
| Product name change | Package rename `codex`→`duet` in REVIVAL_PLAN Phase 1 (H4); broader branding undecided |
| Full IA redesign | Out of scope; calendar-centric model stands |
| Full two-way Google Calendar sync | Only if `.ics` invites prove insufficient |
| Multi-user / group expansion | Out of scope |
