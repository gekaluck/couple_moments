# Couple Moments - Rollout Plan

**Created:** January 27, 2026
**Status:** Pre-production

---

## Current Milestone (checklist)
These are correctness and security issues that will cause real problems with the first users.

### ~~P0-1. Add authorization checks to all mutation functions~~ ✓ Done

**Sources:** Architecture (P0 #2), Code (Critical #1), Product (3d)
**Completed:** 2026-01-30 — [ADR-2026-01-30-mutation-auth-checks.md](../20_adrs/ADR-2026-01-30-mutation-auth-checks.md)

13 mutation functions across 4 files (`notes.ts`, `events.ts`, `ideas.ts`, `availability.ts`) now verify space membership before executing writes. `deleteNote()` additionally enforces author-only deletion. `deleteEvent()` and `deleteIdea()` check membership before deleting child notes to prevent unauthorized data destruction. No function signatures changed.

### ~~P0-2. Revert idea status when its linked event is deleted~~ ✓ Done

**Source:** Product (3a)
**Completed:** 2026-01-30 — PR: feature/p0-2-revert-idea-on-event-delete

`deleteEvent()` now reverts linked ideas by clearing `convertedToEventId` and setting `status = NEW`. Added graceful error handling for missing ideas and a changelog entry for idea restoration. Deleting a scheduled event now properly restores the idea to the "New Ideas" list.

### P0-3. Add middleware.ts auth guard

**Source:** Architecture (P0 #1)
**Status:** Done
**Plan:** TECH_PLAN_P0-3.md
**Implemented:** middleware.ts

Add a Next.js middleware that checks for the `cm_session` cookie on `/spaces/*`, `/events/*`, and `/api/couple-spaces/*` routes. Redirect to `/login` if absent. This is a safety net - pages and API routes keep their existing checks as the authoritative layer.

### P0-4. Sanitize ICS Content-Disposition header

**Source:** Code (Important)

`calendar.ics` route uses `space.name` in the `Content-Disposition` header without sanitizing quotes or newlines. Strip or escape control characters. Narrow fix, real injection vector.

## Next
- Tighten form feedback (loading + inline validation).
- Add error boundaries for core pages.
Also
## 3) P1 — Should Fix Soon

These improve robustness and address user-facing logic issues. Do after P0.

### P1-1. Add Zod validation on server action and API route inputs

**Sources:** Architecture (P0 #3), Code (Minor — parseJsonOrForm), Maintainability (#5)

Replace ad-hoc `if (!title) return` checks with declarative Zod schemas at each entry point. Catches malformed input before the data layer. Also fixes the `parseJsonOrForm` fallback-to-`{}` problem.

### P1-2. Fix rating to be per-user or explicitly shared

**Source:** Product (3c)

The current single `rating` field means Partner B silently overwrites Partner A's rating. Either store two ratings (one per member, recommended for a couples app) or show who last rated and prompt before overwriting.

### P1-3. Add rate limiting on auth endpoints

**Sources:** Architecture (P1 #4), Code (Important)

`/api/auth/login` and `/api/auth/register` have no throttling. Add basic rate limiting (e.g., per-IP, 5 attempts/minute).

### P1-4. Add comment deletion on event and idea detail pages
**Source:** Product (3e)

Comments can currently only be deleted from the Notes page, which users won't discover. Show a delete button (author-only, per P0-1) on the entity where the comment was posted.

### P1-5. Add cascade deletes for space-owned entities

**Source:** Architecture (P1 #5)

Configure `onDelete: Cascade` from `CoupleSpace` to `Event`, `Idea`, `Note`, `AvailabilityBlock` and from `Event` to `Photo`, `Notification`. Prevents orphan accumulation if a space or event is deleted. The application-level cleanup in `deleteEvent`/`deleteIdea` remains but the database becomes the safety net.


## 4) P2 — Defer

These are valid findings but premature or low-impact at current scale.

| Item | Source(s) | Why defer |
|------|-----------|-----------|
| Reconcile `EventType` enum with runtime date logic | Product, Architecture | Nothing reads `type` after creation. Resolve before building notifications/analytics. |
| Test infrastructure (API integration tests first) | Maintainability, Architecture | Important but not blocking launch for 2 users. Start after P0/P1 stabilize. |
| CSRF tokens on API routes | Code | `SameSite=lax` + server actions' built-in CSRF protection cover the main vectors. |
| Password strength policy | Code | Low-impact for invite-only couples app. |
| UX: empty states, loading skeletons, inline validation | UX | Polish, not correctness. Do after logic is right. |
| Invite code rotation/expiration | Product | 2-member cap limits damage. |
| Leave-space flow | Product | Requires product decisions on content ownership. Wait for user demand. |
| Availability conflict detection | Product | Useful but requires UI coordination work. |
| Extract Place into its own model | Architecture | Manageable duplication across 2 models. |
| Replace JSON-string tags with relation | Architecture | Works for display; no tag-based search on roadmap. |
| Accessibility audit | UX | Important, but schedule as a dedicated pass. |

## Tech Debt
- Scheduled cleanup for expired sessions.
- Add request logging and rate limiting.
- Type-safe env validation.
- CI/CD pipeline baseline.

## Definition of Done
- Tests: `npm run build` passes; smoke test checklist complete.
- Docs: update `docs/00_current/rollout_plan.md` status.
- Review: changes reviewed and merged.

## 5) Explicit Non-Actions

These were raised by evaluators but are **not problems** to solve.

- **Do not restructure `lib/` into repository/service/types subdirectories.** (Maintainability #3) The current entity files are 100-460 lines. This is not a cohesion problem. Adding directory nesting increases navigation cost for no measurable benefit at this scale.

- **Do not add a repository/ORM abstraction layer.** (Maintainability #4) One data store, one ORM, pre-production. Prisma is used correctly through `lib/` helpers. Abstracting it adds indirection without value.

- **Do not add auto-transition from PLANNED to MEMORY.** (Product non-issue) The UI uses runtime date comparison, which produces the correct visual result. No background job needed.

- **Do not sync idea edits back to converted events.** (Product non-issue) Once an idea becomes an event, the event is the source of truth. Independent editing is correct.

- **Do not add comment threading.** (Product non-issue) Flat comments are appropriate for 2-user conversational context. Schema supports it if needed later.

- **Do not separate business logic from API routes into a service layer.** (Maintainability #2) Server actions already act as thin controllers calling `lib/` functions. The current pattern is the right one for Next.js App Router. API routes that have inline logic should be tightened opportunistically, not restructured.
