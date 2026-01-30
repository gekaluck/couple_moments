# Evaluation Summary

**Date:** 2026-01-30
**Status:** Pre-production
**Inputs:** 5 independent evaluation reports (architecture, product logic, code security, UX, maintainability)

---

## 1) Executive Summary

The application has a sound foundation: correct multi-tenancy model, server-side mutation boundary, proper session design, and a clean Idea → Event → Memory product loop. The core architecture does not need to be redesigned.

**What actually matters right now:**

- **Authorization gaps in mutation functions.** Three reports independently identified that `updateEvent`, `deleteEvent`, `updateIdea`, `deleteIdea`, and `createIdeaComment` do not verify space membership at the data layer. This is the single highest-risk issue. A single future call-site that skips the layout-level check becomes a cross-space authorization bypass.
- **Idea orphaning on event deletion.** Deleting an event that was created from an idea leaves the idea permanently invisible. No user would expect this behavior. It will cause confusion on first real use.
- **No defense-in-depth for auth.** Every route enforces auth individually. A single omission on a new page silently exposes data. A lightweight middleware guard prevents this class of regression entirely.

**What does not matter right now:**

- Restructuring `lib/` into repository/service/types subdirectories. The current flat files are ~100-460 lines each. This is not a cohesion problem at this scale.
- Abstracting Prisma behind a repository pattern. One data store, one ORM, pre-production. Premature.
- EventType enum inconsistency. The stored `type` field disagrees with runtime date checks, but nothing reads `type` after creation. Latent, not active.
- UX polish (empty states, loading skeletons, card layout standardization). Important for user experience, but not blocking correctness. Do after the logic is right.

---

## 2) P0 — Must Fix Now

These are correctness and security issues that will cause real problems with the first users.

### P0-1. Add authorization checks to all mutation functions

**Sources:** Architecture (P0 #2), Code (Critical #1), Product (3d)

`updateEvent()`, `deleteEvent()`, `updateIdea()`, `deleteIdea()`, `createIdeaComment()`, and `deleteNote()` trust that callers verified membership. Make each function self-contained: accept `userId`, verify space membership before executing. The read functions (`getEventForUser`, `getIdeaForUser`) already do this — mutations must match.

For `deleteNote()` specifically, also enforce author-only deletion: verify `userId === note.authorUserId`. This resolves the product rule gap (can one partner delete the other's comments?) with the expected default: no.

### P0-2. Revert idea status when its linked event is deleted

**Source:** Product (3a)

When `deleteEvent()` runs on an event with `originIdeaId`, clear the linked idea's `convertedToEventId` and set `status = NEW`. Without this, deleting a scheduled event permanently buries the idea with no recovery path.

### P0-3. Add middleware.ts auth guard

**Source:** Architecture (P0 #1)

Add a Next.js middleware that checks for the `cm_session` cookie on `/spaces/*`, `/events/*`, and `/api/couple-spaces/*` routes. Redirect to `/login` if absent. This is a safety net — pages and API routes keep their existing checks as the authoritative layer.

### P0-4. Sanitize ICS Content-Disposition header

**Source:** Code (Important)

`calendar.ics` route uses `space.name` in the `Content-Disposition` header without sanitizing quotes or newlines. Strip or escape control characters. Narrow fix, real injection vector.

---

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

---

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

---

## 5) Explicit Non-Actions

These were raised by evaluators but are **not problems** to solve.

- **Do not restructure `lib/` into repository/service/types subdirectories.** (Maintainability #3) The current entity files are 100-460 lines. This is not a cohesion problem. Adding directory nesting increases navigation cost for no measurable benefit at this scale.

- **Do not add a repository/ORM abstraction layer.** (Maintainability #4) One data store, one ORM, pre-production. Prisma is used correctly through `lib/` helpers. Abstracting it adds indirection without value.

- **Do not add auto-transition from PLANNED to MEMORY.** (Product non-issue) The UI uses runtime date comparison, which produces the correct visual result. No background job needed.

- **Do not sync idea edits back to converted events.** (Product non-issue) Once an idea becomes an event, the event is the source of truth. Independent editing is correct.

- **Do not add comment threading.** (Product non-issue) Flat comments are appropriate for 2-user conversational context. Schema supports it if needed later.

- **Do not separate business logic from API routes into a service layer.** (Maintainability #2) Server actions already act as thin controllers calling `lib/` functions. The current pattern is the right one for Next.js App Router. API routes that have inline logic should be tightened opportunistically, not restructured.

---

## 6) Suggested Execution Order

8 steps. Each is independently shippable.

| Step | What | Scope | Depends on |
|------|------|-------|------------|
| 1 | **Add `middleware.ts` auth guard** | New file, ~20 lines. Cookie check on protected route prefixes. | Nothing |
| 2 | **Add authorization to mutation functions** | Edit `events.ts`, `ideas.ts`, `notes.ts`. Each mutation verifies space membership and (for notes) author ownership. | Nothing |
| 3 | **Revert idea on event deletion** | Edit `deleteEvent()` in `events.ts`. If event has `originIdeaId`, clear idea's `convertedToEventId` and set `status = NEW`. | Step 2 (mutations now have userId) |
| 4 | **Sanitize ICS header** | Edit `calendar.ics/route.ts`. Strip control characters from `space.name`. | Nothing |
| 5 | **Add Zod schemas to server actions and API routes** | New shared schemas, edit each entry point. Replace ad-hoc parsing. | Nothing (can parallel with 1-4) |
| 6 | **Fix rating to per-user** | Schema migration: replace `Event.rating`/`ratedAt` with a `Rating` model (userId + eventId + value). Update `events.ts` and event detail page. | Step 5 (validation in place) |
| 7 | **Add cascade deletes + comment delete button on entity pages** | Schema migration for cascades. Add delete action to event/idea comment components (author-only). | Step 2 (author check in place) |
| 8 | **Add rate limiting on auth endpoints** | Middleware or per-route limiter on `/api/auth/*`. | Nothing (can parallel with 6-7) |

Steps 1, 2, 4, 5, and 8 have no dependencies and can be parallelized. Steps 3, 6, and 7 depend on prior work as noted.

---

*This document is the single source of priorities. Individual evaluation reports remain in the repo root for reference but should not be used to derive new work items independently.*
