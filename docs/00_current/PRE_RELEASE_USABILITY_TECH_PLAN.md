# Pre-Release Usability Technical Plan

## Implementation Status (Updated February 10, 2026)

- [x] Phase 1.1 Auth failure handling in login/register forms
  - Implemented in `b350237`
  - Files: `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`
- [x] Phase 1.2 Event creation parity with place support
  - Implemented in `b350237`
  - Files: `src/app/spaces/[spaceId]/calendar/add-controls.tsx`, `src/app/spaces/[spaceId]/calendar/page.tsx`
- [x] Phase 1.3 Activity feed deduplication for comments
  - Implemented in `b350237`
  - File: `src/lib/activity.ts`

- [x] Phase 2.4 Ideas IA consistency (calendar-centric model)
  - Model chosen: calendar-centric ideas
  - Implemented in `b350237`, finalized with detail-route alignment in `ecd45f6`
  - Files: `src/app/spaces/[spaceId]/calendar/idea-card-list.tsx`, `src/app/spaces/[spaceId]/notes/page.tsx`, `src/lib/activity.ts`, `src/app/spaces/[spaceId]/ideas/page.tsx`, `src/app/spaces/[spaceId]/ideas/[ideaId]/page.tsx`
- [x] Phase 2.5 Partner management controls in settings
  - Policy chosen: creator-only partner removal
  - Implemented in `b350237`
  - Files: `src/app/spaces/[spaceId]/settings/page.tsx`, `src/lib/couple-spaces.ts`, `src/app/spaces/[spaceId]/settings/membership-actions.tsx`
- [x] Phase 2.6 Consistent confirmation UX
  - Initial pass implemented in `b350237`
  - Global `ConfirmForm` modal refactor in `531a7be`
  - Files include `src/app/events/[eventId]/event-comments.tsx`, `src/app/spaces/[spaceId]/ideas/[ideaId]/idea-comments.tsx`, `src/app/spaces/[spaceId]/settings/google-calendar-settings.tsx`, `src/components/ConfirmForm.tsx`

- [x] Phase 3.7 Google integration status clarity
  - Implemented in `bfa8892`
  - File: `src/app/spaces/[spaceId]/settings/google-calendar-settings.tsx`

- [x] Additional post-plan calendar usability fix
  - Expanded day cell content (removed non-actionable `+N more`), moved unavailability above events, owner-color legend for unavailability
  - Implemented in `d3989aa`
  - Files: `src/app/spaces/[spaceId]/calendar/day-cell.tsx`, `src/app/spaces/[spaceId]/calendar/page.tsx`

## Goal
Close the highest-risk usability gaps before production launch so first-time and returning users can reliably:
- sign in/up and recover from errors
- create complete events and ideas without hidden steps
- understand where linked content opens
- trust shared actions and ownership boundaries

## Scope
This plan focuses on UX/usability behavior, not visual redesign.

## Out Of Scope
- New reminder/notification system
- Full IA redesign across all tabs
- Background sync/cron additions

## Phase 1 (P0) - Release Blockers

### 1. Auth failure handling in login/register forms
Current issue:
- `src/app/login/page.tsx` and `src/app/register/page.tsx` submit to API routes directly.
- API routes return JSON for errors, producing a raw error-page UX instead of inline guidance.

Technical changes:
1. Convert login/register page submission to server actions (or redirect-back pattern with `?error=` query state).
2. Normalize error mapping for:
- invalid credentials
- duplicate email
- rate-limit response
3. Preserve entered email on failure.
4. Add inline error region with `aria-live="polite"` for accessibility.

Files:
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/api/auth/login/route.ts` (optional cleanup if server actions own the UX)
- `src/app/api/auth/register/route.ts` (optional cleanup)

Acceptance criteria:
- Failed login/signup never renders raw JSON.
- User sees clear inline error and can retry immediately.

### 2. Event creation parity with place support
Current issue:
- Main event creation modal (`calendar/add-controls`) does not support place search.
- Users must edit after creation to add a place, which is high-friction.

Technical changes:
1. Add `PlaceSearch` to event-create modal in `add-controls`.
2. Mirror hidden place fields pattern already used in:
- event edit modal
- idea creation modal
3. Ensure `handleCreate` in calendar page already parses these fields (it does); verify no regressions in repeat flow.

Files:
- `src/app/spaces/[spaceId]/calendar/add-controls.tsx`
- `src/app/spaces/[spaceId]/calendar/page.tsx` (validation only)

Acceptance criteria:
- User can set place during first event creation.
- Created event detail immediately shows place metadata when selected.

### 3. Activity feed deduplication for comments
Current issue:
- Comment actions can appear twice (change-log update + note-derived comment entry).

Technical changes:
1. Define a canonical source of truth for comment activity cards:
- either `Note` entries only
- or `ChangeLogEntry` only
2. Implement filtering in `listActivityForSpace` to remove duplicates.
3. Keep ordering and linking behavior unchanged.

Files:
- `src/lib/activity.ts`
- `src/app/spaces/[spaceId]/activity/page.tsx` (verify display consistency)

Acceptance criteria:
- One user action == one feed item.
- No duplicate cards for a single comment create.

## Phase 2 (P1) - High Impact Usability

### 4. Ideas information architecture consistency
Current issue:
- `/spaces/[spaceId]/ideas` redirects to calendar, but idea detail route exists.
- Linked idea navigation behavior differs by surface.

Technical changes:
1. Choose one UX model:
- Model A: calendar-centric ideas (no standalone ideas page)
- Model B: standalone ideas page + detail as primary
2. Align all links accordingly:
- notes links
- activity links
- any CTA/buttons pointing to ideas
3. Update copy labels to match model.

Files:
- `src/app/spaces/[spaceId]/ideas/page.tsx`
- `src/app/spaces/[spaceId]/notes/page.tsx`
- `src/lib/activity.ts`
- `src/app/spaces/[spaceId]/space-nav.tsx` (if nav changes)

Acceptance criteria:
- Clicking idea links always lands on expected destination.
- No route feels like a dead-end redirect.

### 5. Partner management controls in settings
Current issue:
- No self-serve way to remove/replace partner for testing and real-world changes.

Technical changes:
1. Add guarded settings actions:
- remove partner membership (owner/member policy required)
- leave space (if user is non-last-member)
2. Add explicit confirmation modal and warnings.
3. Revalidate all space pages after mutation.

Files:
- `src/app/spaces/[spaceId]/settings/page.tsx`
- `src/lib/couple-spaces.ts`
- optional API route for membership management if moving away from page server actions

Acceptance criteria:
- User can safely manage partnership state without DB/manual intervention.
- Dangerous actions are clearly confirmed.

### 6. Replace native confirm dialogs with consistent modal confirms
Current issue:
- Mixed confirmation UI (`confirm()` + custom modal patterns).

Technical changes:
1. Replace native confirm usages with `ConfirmDialog`/`ConfirmForm` patterns.
2. Keep destructive copy and behavior unchanged.

Files (initial pass):
- `src/app/events/[eventId]/event-comments.tsx`
- `src/app/spaces/[spaceId]/ideas/[ideaId]/idea-comments.tsx`
- `src/app/spaces/[spaceId]/settings/google-calendar-settings.tsx`

Acceptance criteria:
- Confirmation UX is visually and behaviorally consistent.

## Phase 3 (P2) - Polish & Trust

### 7. Google integration status clarity
Technical changes:
1. Add compact health summary in settings card:
- connected account
- selected calendars count
- last successful sync timestamp
- latest sync error (if any)
2. Keep actions unchanged.

Files:
- `src/app/spaces/[spaceId]/settings/google-calendar-settings.tsx`

Acceptance criteria:
- Users can answer “is sync working?” in < 3 seconds.

## QA Plan
Manual test suites per phase:
1. Auth suite:
- invalid password, unknown email, duplicate signup, rate limit
2. Planning suite:
- create event with place from main modal; verify event detail map/place
3. Activity suite:
- create one comment, verify single feed entry
4. Navigation suite:
- from notes/activity open linked idea and verify expected destination
5. Settings suite:
- remove/replace partner flows; verify permissions and redirects

## Rollout Strategy
1. Ship Phase 1 behind no flag (required before release).
2. Ship Phase 2 in one or two small PRs after stakeholder decision on Ideas IA.
3. Ship Phase 3 as final polish PR.

## Kickoff Clarifying Questions (ask before implementation starts)
1. Ideas IA decision:
- Should ideas stay calendar-first, or do you want a true standalone ideas page?
2. Partner management policy:
- Who can remove a partner: either member, or only the space creator?
3. Auth error UX:
- Prefer inline errors on same page, or redirect with top-banner error?
4. Destructive confirmations:
- Use existing compact confirm dialogs everywhere, or introduce one unified modal component first?
