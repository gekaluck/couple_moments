# Architecture Evaluation Summary

**Project:** Couple Moments (date_mvp)
**Evaluator role:** Principal Engineer
**Date:** 2026-01-30
**Inputs:** `docs/00_current/ARCHITECTURE.md`, `docs/00_current/CONTEXT.md`, `docs/00_current/rollout_plan.md`, codebase review

---

## 1) Strengths

- **Consistent authorization boundary.** Every space-scoped page enforces auth via `requireUserId()` and membership via `getCoupleSpaceForUser()` at the layout level. API routes independently repeat both checks. Data access functions (e.g., `getEventForUser`, `getIdeaForUser`) scope queries through the `Membership` join, preventing cross-space data leakage.

- **Sound session design.** Database-backed opaque tokens (32-byte random, base64url), HttpOnly/Secure/SameSite=lax cookies, 30-day TTL with auto-cleanup of expired sessions on read. No JWT complexity or client-side token exposure. Password hashing uses bcryptjs with 10 salt rounds.

- **Server actions as the mutation boundary.** All mutations flow through `"use server"` functions or API routes. No client components perform direct data fetching or mutations. This keeps the trust boundary on the server and avoids shipping mutation logic to the client.

- **Simple, appropriate data model.** The `CoupleSpace -> Membership -> User` multi-tenancy model is correct for the domain. The `Idea -> Event` conversion via `originIdeaId` is clean. Enums (`EventType`, `IdeaStatus`, `NoteKind`) keep the schema self-documenting. Indexes exist on high-traffic query paths (`coupleSpaceId + dateTimeStart`, `coupleSpaceId + status`).

- **Prisma client properly singleton'd.** Uses the standard `globalThis` pattern to prevent connection pool exhaustion during Next.js hot reloads in development. Production path avoids re-assignment.

---

## 2) Risks / Weak Points (prioritized)

### P0 - Address before production traffic

1. **No middleware-level auth guard.** Auth is enforced per-page and per-API-route with no global `middleware.ts`. A new route or page added without `requireUserId()` silently becomes unauthenticated. This is the most likely vector for a future regression.

2. **Implicit authorization in mutation functions.** `updateEvent()`, `deleteEvent()`, `updateIdea()`, `deleteIdea()` do not verify space membership themselves. They trust the caller to have already checked. If any future code path calls these functions without prior membership verification, it becomes an authorization bypass. Authorization should be self-contained at the data access layer, not dependent on call-site discipline.

3. **No input validation schema.** Server actions and API routes parse `FormData`/JSON manually with no formal validation (no Zod, no Joi). `parseJsonOrForm()` returns `{}` on parse failure, meaning mutations can proceed with missing required fields. Date parsing, tag normalization, and type coercion are ad-hoc.

### P1 - Address soon

4. **No rate limiting on auth endpoints.** `/api/auth/login` and `/api/auth/register` have no throttling. Brute-force credential stuffing is unmitigated.

5. **Incomplete cascade deletes create orphan risk.** Only `Session -> User` has `onDelete: Cascade`. Deleting a `CoupleSpace` or `User` orphans events, ideas, notes, photos, availability blocks, and change log entries. Manual cleanup exists for notes when deleting events/ideas, but photos are not cleaned up, and space/user deletion has no cleanup path at all.

6. **Place data denormalized across Event and Idea.** Seven identical place-related columns (`placeId`, `placeName`, `placeAddress`, `placeLat`, `placeLng`, `placeUrl`, `placeWebsite`, `placeOpeningHours`, `placePhotoUrls`) are duplicated across both `Event` and `Idea` models. This creates drift risk when an Idea converts to an Event and complicates any future place-related features.

### P2 - Monitor

7. **Tags stored as JSON strings.** Tags are `String @default("[]")` rather than a proper relation or array column. This blocks any database-level querying, filtering, or indexing on tags. Acceptable at current scale but becomes a constraint if tag-based search is needed.

8. **Polymorphic references without FK constraints.** `Note.parentType` + `Note.parentId` and `Reaction.targetType` + `Reaction.targetId` are string-based polymorphic patterns with no database-level referential integrity. Orphan notes/reactions can accumulate silently if parent entities are deleted without cleanup.

9. **No automated test coverage.** The rollout plan acknowledges this. Without tests on auth flows and server actions, regressions in the authorization boundary will not be caught before deployment.

---

## 3) Architectural Improvements Worth Doing NOW

These address structural risks that compound over time and are cheaper to fix before production traffic.

**A. Add a `middleware.ts` auth guard.**
A lightweight Next.js middleware that checks for the `cm_session` cookie on all `/spaces/*`, `/events/*`, and `/api/couple-spaces/*` routes. This creates a defense-in-depth layer so that a missing `requireUserId()` call on a new page doesn't silently expose data. Pages and API routes keep their existing checks as the authoritative layer; middleware acts as a safety net.

**B. Move authorization checks into data mutation functions.**
`updateEvent()`, `deleteEvent()`, `updateIdea()`, `deleteIdea()` should accept `userId` and verify membership before executing. This makes the authorization boundary self-contained and removes the implicit trust in callers. The pattern already exists in the read functions (`getEventForUser` checks membership); mutations should match.

**C. Add schema validation on server action inputs.**
Introduce Zod (already common in the Next.js ecosystem) at the entry point of each server action and API route. This catches malformed input before it reaches the data layer and replaces the ad-hoc `if (!title) return` checks with declarative schemas.

**D. Add `onDelete: Cascade` for space-owned entities.**
Configure cascade deletes from `CoupleSpace` to `Event`, `Idea`, `Note`, `AvailabilityBlock`, and from `Event` to `Photo`, `Notification`. This matches the domain semantics (deleting a space should delete its content) and prevents orphan accumulation. The manual cleanup in `deleteEvent`/`deleteIdea` for notes can remain as application-level logic but the database becomes the safety net.

---

## 4) Architectural Improvements Worth Deferring

These are sound directions but premature at the current scale and user count.

**A. Extract Place into its own model.**
Normalizing the 9 place columns into a `Place` table with FK references from `Event` and `Idea` would eliminate duplication. Defer because: the current duplication is manageable with 2 models, and the conversion logic is simple. Worth doing when/if place data grows (reviews, favorites, place-based search).

**B. Replace JSON-string tags with a proper relation.**
A `Tag` model with a many-to-many join table would enable database-level tag queries and filtering. Defer because: the current `parseTags`/`normalizeTags` pattern works for display, and tag-based search is not on the roadmap yet.

**C. Replace polymorphic string references with concrete FKs.**
`Note.parentType`/`Note.parentId` and `Reaction.targetType`/`Reaction.targetId` could become concrete nullable FKs (`eventId`, `ideaId`, `noteId`). Defer because: the current pattern works and the manual cleanup in delete functions covers the primary cases. Worth doing if the number of target types grows beyond 2-3.

**D. Add Next.js middleware for RBAC.**
The `Membership.role` field exists (`@default("member")`) but no role-based access control is implemented. If admin-vs-member distinctions become needed, middleware or a shared guard function should enforce role checks. Defer because: the app currently treats all space members equally, which is correct for a couples app.

**E. Background job infrastructure for notifications.**
The `Notification` model and `emailRemindersEnabled` flag exist but no job runner is implemented. When email reminders are needed, a lightweight job queue (e.g., pg-boss, Inngest, or a cron-triggered API route) will be required. Defer because: the feature is not active and adding job infrastructure prematurely adds operational burden.

**F. Formal observability and error tracking.**
No structured logging, APM, or error tracking is in place. At scale, this becomes necessary for debugging production issues. Defer because: the app is pre-production with a small user base, and console-level observability is sufficient for now.

---

*This evaluation is based on the codebase and documentation as of 2026-01-30. It does not propose code changes or new features.*
