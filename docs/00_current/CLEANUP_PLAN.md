# Repository Cleanup Plan (Unified)

Created: 2026-02-10
Updated: 2026-02-10
Status: In progress on branch `chore-unified-repo-cleanup` (Phase 0-3 complete)

---

## 1) Why this unified plan

This plan merges:
- The previous cleanup assessment (dead files, stale docs, refactor hotspots)
- The new agent draft in this file
- The current in-progress repo diff created by another agent

It is organized as execution phases with explicit scope, acceptance criteria, and commit boundaries.

---

## 2) Current repo state (already changed, not yet committed)

The working tree already contains these cleanup edits:

- Deleted root stubs:
  - `DEPLOYMENT.md`
  - `ROLLOUT_PLAN.md`
- Archived docs moved out of `docs/00_current/`:
  - `GOOGLE_CALENDAR_INTEGRATION_SPEC.md`
  - `PHASE_1_IMPLEMENTATION_COMPLETE.md`
- Updated: `docs/00_current/rollout_plan.md` (Google Calendar Phase 2 marked complete)
- Deleted unused default assets:
  - `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Deleted unused components:
  - `src/components/DropdownMenu.tsx`
  - `src/components/ui/Breadcrumbs.tsx`
- Refactor in progress:
  - Google integration routes switched from `getCurrentUserId` to `getSessionUserId`
  - `getCurrentUserId` removed from `src/lib/current-user.ts`

Open items still visible in working tree:
- Untracked docs:
  - `docs/00_current/CLEANUP_PLAN.md` (this file)
  - `docs/90_archive/GOOGLE_CALENDAR_INTEGRATION_SPEC.md`
  - `docs/90_archive/PHASE_1_IMPLEMENTATION_COMPLETE.md`
  - `docs/JS_WEB_DEV_GUIDE.md`

---

## 3) Comparison: prior assessment vs new draft

### Overlap (agreed)
- Remove obvious dead files/assets/components
- Archive historical docs from `docs/00_current`
- Remove `getCurrentUserId` indirection
- Refresh rollout status for Google Calendar outbound sync
- Add follow-up refactoring for repeated API auth/validation patterns

### Gaps in the new draft (added here)
- Additional likely-dead UI files not yet included:
  - `src/app/spaces/[spaceId]/planning/planning-idea-list.tsx`
  - `src/components/ui/FormField.tsx` (default wrapper likely unused)
  - `src/components/ui/SectionHeader.tsx`
  - `src/components/ui/TagFilter.tsx`
  - `src/components/ui/TodayBadge.tsx`
- Stale core docs not fully addressed:
  - `docs/00_current/CONTEXT.md`
  - `docs/00_current/ARCHITECTURE.md`
  - `docs/00_current/READ_THIS_FIRST.md`
- Performance/maintainability refactors not captured:
  - Large page decomposition (`calendar/page.tsx`, `events/[eventId]/page.tsx`)
  - Duplicate parsing helper consolidation (`parseJsonArray`)
  - Parallelization of independent fetches

### Additions from new draft we keep
- Notification model decision as explicit phase gate
- Dependency audit (`depcheck`/equivalent)

---

## 4) Final multi-phase execution plan

## Phase 0 - Stabilize and commit current in-progress cleanup

Scope:
- Keep and validate the existing pending diff from the other agent
- Ensure no broken references after doc moves/deletes
- Ensure archive moves are staged correctly

Tasks:
- Confirm links still point to `docs/00_current/DEPLOYMENT.md` (not deleted)
- Verify no references require root stubs (`DEPLOYMENT.md`, `ROLLOUT_PLAN.md`)
- Add `nul` to `.gitignore` to prevent recurrence
- Run validation:
  - `npm run lint`
  - `npx tsc --noEmit`
- Commit as baseline cleanup commit

Acceptance criteria:
- Zero type errors introduced
- No broken doc links in active docs
- Baseline cleanup committed on this branch

---

## Phase 1 - Dead code and style sweep

Scope:
- Remove additional unused components/files and corresponding CSS debt

Targets:
- Candidate file removals (after usage re-check):
  - `src/app/spaces/[spaceId]/planning/planning-idea-list.tsx`
  - `src/components/ui/FormField.tsx` (unused wrapper export)
  - `src/components/ui/SectionHeader.tsx`
  - `src/components/ui/TagFilter.tsx`
  - `src/components/ui/TodayBadge.tsx`
- Remove orphan CSS selectors in `src/app/globals.css` tied to deleted UI blocks

Acceptance criteria:
- No imports to deleted files
- Lint and TypeScript pass
- UI remains functionally unchanged for active routes

---

## Phase 2 - Documentation hygiene and source-of-truth alignment

Scope:
- Make `docs/00_current` accurate and minimal

Tasks:
- Update `docs/00_current/READ_THIS_FIRST.md` with current canonical docs list
- Update `docs/00_current/CONTEXT.md` repo map and API description
- Update `docs/00_current/ARCHITECTURE.md` to reflect current integrations and implemented flows
- Refresh `docs/00_current/rollout_plan.md` metadata date/status
- Update `docs/00_current/TECH_PLAN_GOOGLE_CALENDAR.md` references to archived docs
- Decide status of `docs/JS_WEB_DEV_GUIDE.md`:
  - Keep in a dedicated learning/reference location, or
  - Archive, or
  - Remove if out of scope

Acceptance criteria:
- Active docs do not contradict runtime behavior
- Historical docs are in `docs/90_archive`
- One clear source of truth per topic

---

## Phase 3 - API route consolidation

Scope:
- Reduce repeated auth and validation boilerplate across API routes

Tasks:
- Introduce shared helpers in `src/lib/api-utils.ts` (auth, badRequest, zod error formatting)
- Refactor Google integration routes first (already partially aligned)
- Roll same helpers through remaining API routes incrementally
- Standardize JSON error payload shape and status handling

Acceptance criteria:
- Reduced duplicated blocks in `src/app/api/**/route.ts`
- No auth regressions
- Lint/typecheck pass

---

## Phase 4 - Front-end/server refactor for maintainability and performance

Scope:
- Decompose large pages and dedupe repeated utilities

Tasks:
- Split `src/app/spaces/[spaceId]/calendar/page.tsx` into focused submodules
- Split `src/app/events/[eventId]/page.tsx` into focused submodules
- Move duplicated `parseJsonArray` logic into shared utility
- Consolidate date-time formatting usage (e.g., `PlanCard` local formatter)
- Parallelize independent data fetches with `Promise.all` where safe

Acceptance criteria:
- Lower page-file complexity
- Equivalent UX/behavior
- No data correctness regressions

---

## Phase 5 - Schema and dependency governance

Scope:
- Resolve dormant schema and package-level maintenance debt

Tasks:
- Decide `Notification` model strategy:
  - Keep and mark as planned, or
  - Remove via migration
- Run dependency audit and document removals
- Verify dev scripts (`scripts/seed-demo.ts`) are still needed and documented
- Add periodic cleanup checks (dead code/dependency audit cadence)

Acceptance criteria:
- Explicit schema decision documented
- No clearly-unused runtime dependencies left

---

## 5) Commit strategy

Recommended commit sequence:
1. `chore(cleanup): baseline pending cleanup from previous agent`
2. `chore(cleanup): remove remaining dead ui files and css`
3. `docs(cleanup): align current docs and archive stale references`
4. `refactor(api): introduce shared api auth/validation helpers`
5. `refactor(app): split large pages and dedupe parsing/formatting`
6. `chore(schema): resolve notification model and dependency audit`

Each commit must pass lint and typecheck before moving to next phase.

---

## 6) Decisions recorded (2026-02-10)

1. Root stub docs (`DEPLOYMENT.md`, `ROLLOUT_PLAN.md`): remove permanently. Keep current docs under `docs/00_current/`.
2. `docs/JS_WEB_DEV_GUIDE.md`: keep out of git for now (local-only, ignored).
3. `Notification` model: keep for potential future implementation.

No blocking decisions remain for Phase 0 and Phase 1.
