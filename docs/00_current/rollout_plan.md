# Rollout Plan & Backlog

Updated: 2026-02-17

## Status

Private beta — testers have not yet onboarded. Primary goal before first user session: close UX and reliability gaps below.

---

## Priority Levels

| Level | Meaning |
|---|---|
| **P0** | Must fix before any beta tester touches the app |
| **P1** | High-impact UX — should ship in the first beta iteration |
| **P2** | Testing — foundation for ongoing confidence |
| **P3** | CI / infra hardening |
| **P4** | Tech debt — does not block users, but increases velocity and correctness over time |
| **Deferred** | Explicitly out of scope for current cycle |

---

## P0 — Pre-Beta Blockers

### B-1 · Password reset flow
**Problem:** No forgot-password or reset flow exists anywhere. Beta testers who forget their password have no recovery path and require manual DB intervention.
**Scope:** New pages at `/forgot-password` and `/reset-password/[token]`, a reset token model (or reuse of the `Session` table), and an email send step.
**Files to create/touch:** `src/app/forgot-password/page.tsx`, `src/app/reset-password/[token]/page.tsx`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `prisma/schema.prisma` (new model or field), email sending utility.
**Acceptance:** User can receive a reset link, set a new password, and log in successfully. Token expires after use or after a time window.

---

### B-2 · Calendar empty state hides the month grid
**Problem:** When a month has zero events and zero busy blocks, the entire month grid is replaced by `CalendarEmptyState`. A brand new user sees a prompt but cannot click days to add events — the grid is gone.
**File:** `src/app/spaces/[spaceId]/calendar/page.tsx:671`
**Fix:** Always render the month grid. Show the empty state as a contextual banner or overlay within the grid, not instead of it.
**Acceptance:** New user can see the month grid and click a day to add their first event.

---

### B-3 · Server actions silently fail on invalid input
**Problem:** Inline server actions in `calendar/page.tsx` and `events/[eventId]/page.tsx` return early with no user feedback when validation fails (e.g. `if (!title) return;`). The form just resets with no indication of what went wrong.
**Files:** `src/app/spaces/[spaceId]/calendar/page.tsx` (all `handle*` functions), `src/app/events/[eventId]/page.tsx`
**Fix:** Return structured error state that the client component can display. Use URL-driven error state (e.g. `?error=missing-title`) or a toast feedback pattern.
**Acceptance:** A user who submits an incomplete form sees a clear, actionable error message.

---

### B-4 · Delete button shown on partner's notes
**Problem:** The Notes page shows a delete button on every note including partner-authored ones. The server-side `deleteNote()` auth check blocks the action, but the UI implies users can delete content they cannot.
**File:** `src/app/spaces/[spaceId]/notes/page.tsx:300`
**Fix:** Conditionally render the delete button only when `note.authorUserId === userId`.
**Acceptance:** Users only see delete affordances on their own notes.

---

## Pre-Login Landing Page

**Status: completed** — Unauthenticated visitors at `/` now see a full landing page explaining what Duet is (hero, features, how-it-works, CTA). Authenticated users are still redirected to their space as before. This resolved real user confusion where people arrived at the app cold and saw a login form with no context.

---

## P1 — High-Impact UX

### U-1 · Event end time on create and edit
**Problem:** `dateTimeEnd` exists in the schema but is never collected during event creation or editing. Users cannot express a time range for an event.
**Files:** `src/app/spaces/[spaceId]/calendar/add-controls.tsx`, `src/app/events/[eventId]/event-edit-modal.tsx`, `src/app/spaces/[spaceId]/calendar/page.tsx` (`handleCreate`), `src/app/events/[eventId]/page.tsx` (`handleUpdate`)
**Acceptance:** User can optionally set an end time on create and edit. Event detail displays time range when both are set.

---

### U-2 · Broken idea anchor links from Notes page
**Problem:** Notes linked to ideas show a "Linked idea comment" link pointing to `/spaces/[spaceId]/calendar#idea-${parentId}`. The calendar page does not render those anchor IDs, so the link lands on the calendar with no scroll target.
**Files:** `src/app/spaces/[spaceId]/notes/page.tsx:293`, calendar idea card components.
**Fix:** Either add `id="idea-${idea.id}"` to idea card containers on the calendar page, or link to the idea detail page at `/spaces/[spaceId]/ideas/[ideaId]` instead.
**Acceptance:** Clicking a linked idea comment from Notes navigates to the correct idea.

---

### U-3 · Invite code inaccessible after partner joins
**Problem:** `InviteCard` is only rendered when `!isSpaceComplete`. Once a partner joins, there is no way to retrieve or share the invite code. This matters for re-inviting or onboarding new scenarios.
**File:** `src/app/spaces/[spaceId]/settings/page.tsx:324`
**Fix:** Always show the invite card (or a collapsible version) in settings, with copy to make clear the space is full when it is.
**Acceptance:** The invite code is always accessible in settings regardless of space completion status.

---

### U-4 · Memories page: search and filter
**Problem:** All past events are shown in a single flat list with no search or tag filter. As memories accumulate this becomes unusable.
**File:** `src/app/spaces/[spaceId]/memories/memories-client.tsx`
**Fix:** Add client-side search by title and optional tag-filter chips. Memories are loaded fully on the server, so filtering can be client-side.
**Acceptance:** User can type to filter memories by title and click tags to filter by tag.

---

### U-5 · Activity feed: filter by type
**Problem:** Events, ideas, notes, and comments are all mixed in the activity feed with no filtering. Users cannot isolate what they care about.
**File:** `src/app/spaces/[spaceId]/activity/page.tsx`
**Fix:** Add a filter bar (URL-driven via `?type=`) that lets users narrow by entity type: All / Events / Ideas / Notes.
**Acceptance:** User can filter the activity feed and the URL reflects the active filter (shareable/refreshable).

---

### U-6 · Calendar subtitle copy
**Problem:** "Tap any day to add something special or block time." — "Tap" implies mobile. Most beta users will be on desktop.
**File:** `src/app/spaces/[spaceId]/calendar/page.tsx:588`
**Fix:** Change to "Click any day to add an event or block time."
**Acceptance:** Copy is device-neutral.

---

### U-7 · Onboarding tour completion persistence
**Problem:** The onboarding tour's dismissed/completed state is not persisted beyond the session. Users who reload see it again.
**File:** `src/components/onboarding/OnboardingTour.tsx`
**Fix:** Persist completion state in `localStorage` (keyed by spaceId) or as a user preference in the DB.
**Acceptance:** Dismissed tour stays dismissed across page loads and browser restarts.

---

## P2 — Test Coverage

### T-1 · Auth smoke tests (Playwright)
Write e2e tests covering:
- Register with a new email → land on onboarding
- Login with valid credentials → land on space/calendar
- Login with invalid credentials → see inline error, no raw JSON
- Logout → redirect to login

**Files to create:** `tests/auth.spec.ts`

---

### T-2 · Core planning flow tests (Playwright)
Write e2e tests covering:
- Create event (with and without place) → appears on calendar
- Create idea → appears in ideas column
- Schedule idea → event appears, idea moves to planned state
- Delete event → idea reverts to new

**Files to create:** `tests/planning.spec.ts`

---

### T-3 · Playwright config and test helpers
Set up `playwright.config.ts`, base URL, auth helper (create and seed a test user/space), and CI integration step.
**Files to create:** `playwright.config.ts`, `tests/helpers/auth.ts`

---

## P3 — CI / Infra

### I-1 · Make lint and type-check blocking in CI
**Problem:** Both steps have `continue-on-error: true` — they never fail a build. Since both currently pass cleanly, removing this is zero-risk and prevents regressions from silently shipping.
**File:** `.github/workflows/ci.yml:27,31`
**Fix:** Remove both `continue-on-error: true` lines.
**Acceptance:** A PR with a lint error or type error fails CI and cannot be merged.

---

### I-2 · Add Vercel deployment config
**Problem:** Vercel is the target platform but no `vercel.json` or build/migration hooks are configured. Database migrations must be run manually before each release.
**Files to create:** `vercel.json` (if needed for build overrides or regions), document a pre-deploy migration step.
**Fix:** Consider a `postbuild` or deployment hook that runs `prisma migrate deploy`. Alternatively, document a release runbook in `DEPLOYMENT.md` for the Vercel-specific flow.
**Acceptance:** Deployments are repeatable and migration step is not manual-only.

---

### I-3 · Remove `prisma/dev.db` from repo
**Problem:** A SQLite dev database file is committed. It adds noise, is not used in production, and can contain stale dev data.
**Fix:** Delete `prisma/dev.db`, add `prisma/*.db` to `.gitignore`.
**Acceptance:** No database file in the repository. `.gitignore` prevents future commits.

---

## P4 — Tech Debt

### D-1 · Extract shared place field parser
**Problem:** The same 10-field place extraction block (`placeId`, `placeName`, `placeAddress`, `placeLat`, `placeLng`, `placeUrl`, `placeWebsite`, `placeOpeningHours`, `placePhotoUrls`, `placeLng`) is copy-pasted identically into 5+ server actions.
**Fix:** Extract a `parsePlaceFields(formData: FormData)` helper in `src/lib/parsers.ts`. Call it from all server actions.
**Acceptance:** One function, called from all mutation handlers.

---

### D-2 · Decompose `calendar/page.tsx`
**Problem:** ~795 lines, 7 inline server actions, all data loading, all rendering in a single file. Hard to review and reason about.
**Fix:** Extract server actions into a co-located `actions.ts`. Extract data loading (already started with `page-data.ts`). The JSX render tree can be further componentized.
**Acceptance:** `calendar/page.tsx` is under 300 lines. Actions are in a dedicated file.

---

### D-3 · Decompose `events/[eventId]/page.tsx`
**Problem:** ~740 lines, multiple inline server actions.
**Fix:** Same approach as D-2 — extract actions into `actions.ts`.
**Acceptance:** `page.tsx` is under 300 lines.

---

### D-4 · Audit and clean `SESSION_SECRET`
**Problem:** `SESSION_SECRET` appears in `.env.example` but is not checked or used at runtime. Either use it or remove it to avoid confusion.
**Files:** `.env.example`, `src/lib/session.ts`
**Acceptance:** `.env.example` only lists env vars that are actually read by the application.

---

## Deferred

| Item | Reason |
|---|---|
| Email / push notifications | `Notification` model kept as placeholder. Out of scope for current cycle. |
| Multi-timezone support | Not a concern for current beta cohort. |
| Per-user calendar preferences in DB | Cookie-based prefs are acceptable for current users. |
| Product name change | Pending decision — `package.json` `name` field and any branding to be updated when decided. |
| Full IA redesign | Out of scope. Calendar-centric model is current standard. |

---

## Completion Tracking

| ID | Title | Status |
|---|---|---|
| B-1 | Password reset flow | completed |
| B-2 | Calendar empty state hides grid | completed |
| B-3 | Server actions silent failures | completed |
| B-4 | Delete button on partner notes | completed |
| U-1 | Event end time on create/edit | completed |
| U-2 | Broken idea anchor links | completed |
| U-3 | Invite code post-partner | completed |
| U-4 | Memories search + filter | pending |
| U-5 | Activity feed filter | pending |
| U-6 | Calendar subtitle copy | completed |
| U-7 | Onboarding tour persistence | completed |
| T-1 | Auth smoke tests | pending |
| T-2 | Core planning flow tests | pending |
| T-3 | Playwright config + helpers | pending |
| I-1 | CI lint/type-check blocking | completed |
| I-2 | Vercel deployment config | pending |
| I-3 | Remove prisma/dev.db | completed |
| D-1 | Extract place field parser | pending |
| D-2 | Decompose calendar/page.tsx | pending |
| D-3 | Decompose events/page.tsx | pending |
| D-4 | Audit SESSION_SECRET | pending |
