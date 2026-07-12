# Duet Revival Log

Running log of the revival effort. One section per phase. Companion to `REVIVAL_PLAN.md` (the plan) and `AUDIT.md` (findings + status addendum).

## Phase 0 — Audit actualization, docs cleanup & plan (2026-07-09, branch `docs/revival-plan`)

**Done:**
- Re-verified the June audit against the current tree (`0df05c7`): 8 of 22 findings fixed, 5 partial, 9 open. Added §6 status addendum to `AUDIT.md` and committed it (was untracked since June).
- Verified green baseline: `npx tsc --noEmit` ✅, `npm run lint` ✅ (no code changed this phase).
- Wrote `REVIVAL_PLAN.md` — the step-by-step plan for phases 1–4 with checkpoints, Q&A sessions, and the screenshot review protocol. Key reality corrections vs the original brief are in its §0 (notably: no unfinished Google sign-in exists — the Google *Calendar* integration is complete and stays; Resend email + ICS export already exist as foundations for Phase 4).
- Docs cleanup (June plan items C2-1..C2-5, never executed): archived to `docs/90_archive/` with dated notes — `PRE_RELEASE_USABILITY_TECH_PLAN.md` (Feb cycle complete), `PHOTO_UPLOAD_SPEC.md` (shipped; env docs live in DEPLOYMENT.md), `IMPLEMENTATION_PLAN_2026-06.md` (superseded by REVIVAL_PLAN.md; open items carried over), `Duet Mobile Wins Plan.md` (shipped via PR #39/#40), `JS_WEB_DEV_GUIDE.md` (generic guide, not project documentation).
- Actualized `docs/00_current/`: refreshed `rollout_plan.md` (collapsed the completed Feb cycle, carried open items forward), fixed the stale repo map in `CONTEXT.md`, updated the read order in `READ_THIS_FIRST.md`, added a DECISIONS entry for the revival approach.

**Removed:** nothing (all moves, no deletions — deletions are gated on Checkpoint 1).

**Deferred / carried forward:** everything in `REVIVAL_PLAN.md` phases 1–4 and its Deferred table.

**Waiting on:** ⛔ Checkpoint 1 — merge `feat/whats-ahead-redesign`, approve the deletion list (plan §Phase 1.1), branch disposition, Google decision confirmation.

## Phase 1 — Hygiene (2026-07-10, branch `hygiene`)

**Checkpoint 1 approvals received:** merge done (PRs #41/#42), deletion list approved, obsolete branches confirmed, Google integration stays.

**Done:**
- **Branch pruning (H6):** deleted 41 merged local branches + the two obsolete ones (`codex/ui-enhancements`, `feature/p0-2-revert-idea-on-event-delete` — local and remote, per approval). Local repo now has only `master` + the active phase branch.
- **Dead CSS purge (H1):** `globals.css` 1046 → 487 lines. Removed ~35 classes re-verified as zero-reference (feedback-*, field/input-error, bg-tonal-*, bg-noise, calendar-today/weekend/now-marker/compact/comfortable, event-dot*, legend-*/calendar-legend, quick-action*, empty-description-prompt, panel-expand, modal-panel, card-selectable, badge-pulse, animate-wiggle/bounce-soft/pulse-soft/checkmark, focus-ring, image-fade, interactive, surface-strong, card-content, text-body/heading, section-divider, .card, .section, both dead `.section-title` defs) plus their orphaned keyframes; deduped `.section-subtitle` (kept the winning 0.875rem definition).
- **Token collapse (H2):** deleted the unused short feedback palette (`--success/--warning/--error/--info` families) — `--status-*` is now the single canonical feedback palette. Also deleted zero-reference variable families (item-type tokens except the used `--idea-new*` + `--calendar-memory-dot`, partner colors, `--space-*`, legacy `--bg-*`/`--color-primary*`/`--border-light`, `--surface-100/200/900`, calendar-mode vars).
- **EmptyState merge (H3):** `components/planning/EmptyState.tsx` deleted; `components/ui/EmptyState.tsx` gained `icon`/`framed`/`actionLabel`/`onAction` props; both planning consumers updated.
- **Package rename (H4):** `codex` → `duet`.
- **Type dedup (H5):** new `src/lib/google-sync.ts` exports `GoogleSyncStatus`; replaced 10 inline re-declarations across 9 files.
- **Dependencies:** patch/minor updates via `npm update` + explicit Next 16.1.1→16.2.10, React 19.2.3→19.2.7. `npm audit`: 34 → 5. Remaining 5 moderate are transitive (prisma dev-CLI `@hono/node-server`, next's bundled `postcss`) with no non-breaking fix — accepted. **Majors flagged, not taken:** @types/node 26, eslint 10, googleapis 173, lucide-react 1.x, typescript 7.
- **Lint fix from new rule:** `EventPhotoGallery` sync-from-props effects → render-phase state adjustment (`react-hooks/set-state-in-effect` shipped with eslint-config-next 16.2).
- **Smoke tests (T-1..T-3):** `playwright.config.ts` + `tests/{auth,planning}.spec.ts` + helpers + `global-setup.ts`. Tests run against a dedicated docker Postgres (`duet-test-pg`, port 5533) — never the .env database; CI gets a service container + `smoke` job (build → `next start` → playwright, traces uploaded on failure). 5 tests: register→onboarding, logout+login, wrong-password inline error, auth redirect, and the full event→idea→schedule→delete-reverts-idea flow. All green locally.
- `.gitignore`: added `test-results/`/`playwright-report/`; removed stale `docs/JS_WEB_DEV_GUIDE.md` entry (file now archived and tracked).

**Removed:** see deletions above; every class/variable was grep-verified zero-reference at deletion time.

**Kept/flagged, not removed:** redirect shims (`notes/`, `planning/`, `ideas/` list, `inbox/`) — they keep old links working.

**Discovered, deferred:** the app uses Google Maps legacy `places.Autocomplete`, which Google deprecated for new customers (2025-03) — still functional, migration to `PlaceAutocompleteElement` should be scheduled (Phase 3 or later). Calendar/event page `actions.ts` extraction (D-2/D-3) intentionally left out of this PR for reviewability — **must land before Phase 4 touches event mutations.**

## Phase 2 — Mobile bug squash (in progress, branch `mobile-bugs`)

Repro method: seeded an isolated QA account/space in the dev DB (membership-scoped, does not touch real data) and drove it at 390px. Note: the in-app preview browser proved unreliable for interaction verification (screenshots time out; overlay-link clicks resolve to 0,0), so fixes are verified with Playwright (real click semantics) instead.

**Bug 1 — memory click doesn't navigate (highest priority): FIXED.**
- **Root cause:** the memory card's whole-card `<Link>` used the "stretched link" pattern but was layered *below* its own content. The link was `absolute inset-0 z-0`; the text wrapper was `relative z-[1]` and the `MemoryCover` came later in the DOM — both painted above the link and intercepted every tap, so the click never reached the anchor. It also had no accessible name (empty overlay link).
- **Fix** (`memories-client.tsx:446`): raise the overlay to `z-20` (above all card content; max content z was 10) and add `aria-label={"Open " + title}`. Since the card has no other interactive descendants, the whole card is now one reliable tap target.
- **Verified:** new `tests/memories.spec.ts` creates a past-dated event and asserts the memory card navigates to `/events/…`. Playwright confirms the overlay link now intercepts pointer events across the card (the exact inverse of the bug). Green.

**Bug 3 — no "block" option in the mobile "+" menu: ALREADY FIXED in code (shipped PR #40), not a live defect on current master.**
- The mobile `FloatingActionButton` has a "Block time" item → `?action=block` (`FloatingActionButton.tsx:36-42`); `calendar/page.tsx:99` maps `action=block` → `autoOpenBlock`, passed to `CalendarAddControls` which opens the block panel (`add-controls.tsx:64,143`). Block edit/delete on mobile (audit F2) also works via agenda `?editBlock=` rows. No code change needed; this was a stale-production symptom.

**F15 — event detail lacked the mobile shell: FIXED (user chose "add shell").**
- **Root cause:** `/events/[eventId]` lives outside `spaces/[spaceId]/layout.tsx`, so it never rendered `BottomTabBar`/`FAB`. On a phone the app's global navigation disappeared on its most-visited screen (the destination of nearly every memory/activity/agenda tap); the only way onward was a single Back link.
- **Fix** (`events/[eventId]/page.tsx`): render `FloatingActionButton` + `BottomTabBar` (using the event's `coupleSpaceId`) and add `pb-24` to the main so content clears the fixed bar. The event page keeps its own contextual header as the top bar (no duplicate `MobileTopBar`).
- **Verified:** `tests/memories.spec.ts` reloads the event page at 390px and asserts the bottom tab bar (Calendar/Activity) is present.
- Considered and not chosen: moving the route under the space shell (cleaner IA but touches every `/events/[id]` link) — deferred per the user's decision.

**Bugs 2 & 4 (button cutoff; calendar mobile usability): deferred to Phase 3** per the user's decision — both are subjective/real-device and Phase 3 is screenshot-driven anyway. Bug 2 needs real-device iOS screenshots; bug 4 needs a fresh assessment of the June calendar redesign.

**Net Phase 2:** bug 1 fixed (core navigation), F15 fixed (event-page mobile nav), bug 3 confirmed already-fixed; bugs 2 & 4 carried to Phase 3. Two new regression tests. Six smoke tests green.

## Phase 3 — Design & UX pass (in progress, branch `design-pass`)

Mobile-first per Yevhenii's standing preference. Screenshots were unavailable this session (the preview browser's screenshot action times out), so the review is code-grounded and the visual/real-device items are documented for later in `docs/00_current/DESIGN_REVIEW_2026-07.md`.

**Review:** produced `docs/00_current/DESIGN_REVIEW_2026-07.md` — mobile-first findings across consistency, cards, empty states, first-run, loading/error, plus a revised phase order. Headline: the June redesign already left the mobile calendar and empty states in good shape, so the highest-value work is first-run + consistency, not a card redesign.

**Decisions (Yevhenii):** refine existing cards (no from-scratch redesign); a joining partner's first nudge = "add a date idea"; proceed with structural fixes now, pixel-polish after screenshots.

**Implemented so far:**
- **FR-1 — invite-first onboarding.** `spaces/onboarding/page.tsx`: when `?invite=` is present, the page leads with "Join your partner on Duet", orders the Join card first on mobile (CSS `order`, so no DOM/desktop regression), emphasizes its button, and prefills the code. Root problem it fixes: the joining partner (the exact "girlfriend joins" moment) previously had to scroll past the Create form to find Join. Verified in `tests/onboarding.spec.ts` (heading + Join-above-Create bounding-box order + prefill).
- **First action = add an idea.** `OnboardingTour`: final-step CTA changed from "Start Planning" (just closed) to "Add your first idea", deep-linking to `?action=idea`.

**Screenshot harness (branch `design-screens`):** `tests/screens.spec.ts` — captures 15 mobile screens (fold + full, 390 & 360px) with seeded data to `.screenshots/` (gitignored), gated out of CI by `CAPTURE_SCREENS`. Built because the in-app preview browser's screenshot action times out; Playwright screenshots are reliable and I can read the PNGs. This is the review/verification path for the visual pass.

**Bug #2 — FAB overlapping content: FIXED.** The floating create button rendered over page content on the event and idea detail pages — most visibly the Memory-photos Upload/Paste-URL controls (confirmed in a 390px capture). Root cause: the create FAB was shown on detail/reading pages (event detail via the F15 addition; idea detail via the inherited space layout). Fix: `FloatingActionButton` self-hides on `/events/[id]` and `/ideas/[id]` (usePathname); removed the event page's explicit FAB. Bottom tab bar stays for nav. Verified: `memories.spec` asserts no create-FAB on the mobile event page + before/after captures; FAB remains on the calendar.

**Settings hydration error: FIXED.** `InviteCard` built the invite URL during render with a `typeof window` branch (server → relative, client → absolute `window.location.origin`) and displayed it as text — a hydration mismatch (a React hydration error was logged when the settings page rendered). Fix: render the relative path on SSR + first client render, upgrade to the absolute URL in an effect after mount.

**Deferred to screenshot sessions:** bug #4 (calendar feel) and pixel-polish — checklist in the design-review doc. Remaining code-progressable items: FR-2 (onboarding length), C-1/C-2/C-3 (palette/type/tap-targets), CB-1 (card refinement), LE-1/LE-2 (loading/error, memory cover perf), F13. Other first-look items: Private Beta banner eats first-screen space; two redundant create paths on calendar; onboarding tour is 8 steps.

## Phase 4 — Email invites & notifications

_Not started._
