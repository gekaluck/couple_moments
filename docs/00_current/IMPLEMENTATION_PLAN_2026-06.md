# Implementation Plan — June 2026 Cycle

Updated: 2026-06-11
Inputs: `AUDIT.md` (repo root, fresh-eyes audit), user-reported production bugs (2026-06-11), `docs/Duet Mobile Wins Plan.md` status check, `docs/00_current/rollout_plan.md` leftovers.

## Where we are

- **Mobile Wins Plan: fully shipped** on `feat/mobile-activity-redesign` (P0 Activity `3f033aa`, P1 Memories + What's Ahead rail `c8d0171`, P2 Settings `5a1b75e`, follow-ups `db92e05`, `9dd0987`). **Not merged to master — production is behind this branch.** Only unshipped plan items: infinite scroll (§7) and moving the Memories year filter into chips/sheet on mobile (§3.3).
- **rollout_plan.md (Feb cycle):** everything completed except T-1/T-2/T-3 (Playwright tests), D-1 (place parser), D-2/D-3 (page decomposition). U-5 (activity filters) was effectively delivered by the Activity redesign — mark complete.
- **Audit:** 22 findings in `AUDIT.md`; F1 (schedule-idea timezone bug) confirmed in production by the user.

---

## Workstream A — Bugfixes & quick wins

### Phase A0 — Unblock production (first)

| # | Task | Notes | Effort |
|---|------|-------|--------|
| A0-1 | **Fix F1 timezone bug** — `handleScheduleIdea` ignores user timezone | **DONE 2026-06-11** (this session): IdeaCard schedule form now sends `timeZoneOffsetStart`; `handleScheduleIdea` uses `parseLocalDateTime`. | — |
| A0-2 | Merge `feat/mobile-activity-redesign` → master, deploy | User is testing stale prod; all mobile-wins work + the TZ fix are stuck on this branch. | S |
| A0-3 | Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in Vercel | Root cause of "no photo uploader on mobile, only URL": `EventPhotoGallery` hides the Upload tab when these are unset (`canUploadDirectly=false`). Setup steps are in `PHOTO_UPLOAD_SPEC.md` / `DEPLOYMENT.md`. **Owner: Yevhenii (Vercel dashboard).** Code already supports mobile camera-roll via `accept="image/*"`. | S |

### Phase A1 — User-reported mobile fixes (all S)

| # | Task | Detail |
|---|------|--------|
| A1-1 | **Block time reachable on mobile.** | The "Block time" button *does* render on mobile (top of calendar) but is undiscoverable. (a) Add a third "Block time" item to `FloatingActionButton` linking to `?action=block`; (b) handle `action=block` in `CalendarAddControls` (same pattern as the existing `action=idea` auto-open). |
| A1-2 | **Block edit/delete on mobile** (audit F2). | Make `MobileAgendaView` manual-block rows link to `?editBlock={id}` (modal already exists and works); external Google rows stay non-tappable. |
| A1-3 | **Upcoming plans → horizontal rail** like Ideas. | Apply the Ideas rail pattern (`snap-x snap-mandatory`, `min-w-[72%] max-w-[78%]`, `[&:only-child]:min-w-full`, hidden scrollbar, `md:` back to vertical) to `UpcomingPlansColumn`. Extract the rail wrapper into a shared component so Ideas/Plans don't drift. |
| A1-4 | **Place chip overflow on idea cards** (screenshot bug). | `IdeaCard` place chip is `rounded-full` + `flex-wrap`; long names (e.g. "Чиказький художній інститут") wrap badly/escape the pill. Fix: `rounded-xl`, `max-w-full min-w-0`, `truncate` on the name span, `shrink-0` on icon + Open link. |
| A1-5 | **Uniform idea card heights** in the rail. | Rail items: `items-stretch` on the rail flex + `h-full flex flex-col` on `IdeaCard`'s Card with footer/actions pinned via `mt-auto`. |
| A1-6 | **`GOOGLE_CALENDAR` → `GOOGLE`** source mismatch (audit F11). | One-line fix in `MobileAgendaView.tsx:208`; restores the "· Google" suffix on synced busy blocks. |

### Phase A2 — Audit quick wins (S each unless noted)

| # | Audit ID | Task |
|---|----------|------|
| A2-1 | F3 | Delete the `beforeInteractive` Maps `<Script>` from root layout (`src/app/layout.tsx:49`). The lazy loader in `PlaceSearch`/`place-photos-client` already covers all consumers; static maps are plain `<img>` URLs. Verify place search still works after removal. |
| A2-2 | F6 | Darken `--text-secondary` / `--text-tertiary` to pass AA on the cream surfaces (target ≥ 4.5:1 for secondary, ≥ 3:1 for tertiary-at-12px+). Visual spot-check after. |
| A2-3 | F12 | `handleScheduleIdea`: re-fetch the idea by ID inside the action instead of closing over the page-render `ideas` array (kills stale writes + closure payload bloat). |
| A2-4 | F14 | Add `.catch` + inline error state to `PlaceSearch` `importLibrary`, guard `loadPlacePhotoUrls` in `MemoryCover`; make `handleUpdate` in `events/[eventId]/page.tsx` throw (so the edit modal toasts) instead of silent return. |
| A2-5 | F9 | Delete orphans: `calendar/idea-card-list.tsx`, `notes/notes-filters.tsx`, `notes/loading.tsx`, `ideas/[ideaId]/idea-comments.tsx`, `ui/IconButton.tsx`, `app/sentry-example-page/`, `app/api/sentry-example-api/`. |
| A2-6 | F20 | Fix "Memoris" typo in `EventPhotoGallery`; bump idea action buttons `h-8 w-8` → `h-10 w-10` on mobile (44px target with padding). |
| A2-7 | F5 (partial) | Password minimum (`min(8)`) on register + reset-password. *(Login rate limiting is M — Phase A3.)* |

### Phase A3 — Remaining relevant work (not quick wins; sequenced after A2)

| # | Source | Task | Effort |
|---|--------|------|--------|
| A3-1 | rollout D-1 / audit F4 | Extract `parsePlaceFields` + `parseEventFormData` into `src/lib/event-form.ts`; use from all 4 server actions. **Do this before any further form bugfixes.** | S–M |
| A3-2 | rollout D-2/D-3 / audit F4, F12 | Move server actions out of `calendar/page.tsx` and `events/[eventId]/page.tsx` into co-located `actions.ts`; shared `GoogleSyncResult` type. | M |
| A3-3 | audit F5 | Login rate limiting (per-IP + per-account; the login page already renders the `rate-limited` error code). | M |
| A3-4 | audit F13 / Mobile Wins §3.3 | Activity search on mobile + make search span all pages (server-side `?q=`); Memories year filter into the chip rail or a filter sheet. | M |
| A3-5 | Mobile Wins §7 | Infinite scroll for Activity/Memories (replaces Prev/Next links). | M |
| A3-6 | rollout T-1..T-3 | Playwright smoke tests (auth + create event/idea/schedule flows) — biggest safety net for everything above. | M |
| A3-7 | audit F8/F22 | Timezone story: store a space-level IANA timezone or move day-bucketing client-side. Decision → ADR. | L |

---

## Workstream B — Design review (UX enhancement pass)

**Can it be done without user screenshots? Mostly yes.** Two sources:
1. **Code-level review** — already largely done via `AUDIT.md` (hierarchy, tokens, a11y, dead patterns).
2. **Live review** — run the app locally and capture both breakpoints (375px + desktop) with Playwright (already a devDependency) across all primary flows, seeded with realistic fixture data. This catches what code reading can't: spacing rhythm, overflow with real content (the place-chip bug class), empty/loading states, contrast in situ.

User screenshots are only needed for: real-device iOS Safari behavior (safe-area, keyboard, scroll bounce) and anything "feel"-related in production data.

**Deliverable:** `docs/00_current/DESIGN_REVIEW_2026-06.md` — per-screen findings with screenshots, prioritized enhancement list (same severity scale as AUDIT.md), explicitly scoped to *enhancements* (the bug list above stays in Workstream A).

**Status 2026-06-11:** first design pass shipped on `feat/whats-ahead-redesign`, driven by user screenshots in `docs/screenshots_611/`:
- Fixed mid-word title wrapping (`CardTitle` `break-all` → `break-words`).
- Plan cards (mobile): removed inline edit/comment/delete cluster (title was squeezed to a sliver), full-card tap target with chevron + comment-count indicator, truncating place chip, full-width meta row.
- Idea cards (mobile): bottom action bar — labeled "Schedule" primary button + ghost icons; uniform card heights in the rail.
- Defined the missing `.scrollbar-none` utility (Activity referenced it but it didn't exist) and applied it to Memories chip rails — kills visible scrollbars under filter chips.
- Rail end-padding so the FAB no longer covers the last card.
- New mobile month strip in `MobileAgendaView` (see DECISIONS.md 2026-06-11): collapsible week→month grid with dots; tap-to-scroll into the agenda; empty days deep-link to event creation.

**Iteration 2 (same day, after user testing — screenshots in `docs/screenshots_611/iteration 2/`):**
- Month strip: tapping a day now shows a day-only agenda view (Add + All-days controls); multi-day busy blocks render as a continuous bar across day cells instead of dots.
- New idea detail page at `/spaces/[spaceId]/ideas/[ideaId]` (was a redirect stub): details, location + photos, Schedule/Edit/Delete, comments.
- Plan **and** idea cards are now pure tap targets on mobile (no inline buttons; idea comments no longer open inside the rail card — that interaction was broken).
- Rails: full-width slides with swipe progress dots; bumped mobile card padding.

**Iteration 3 (2026-06-12):** month strip shows single-day busy blocks as dots (bar only for multi-day spans); plan/idea rail cards redesigned as compact tiles (rose date block / place-photo-or-lightbulb block on the left, title + meta + creator on the right — no more stretched empty cards); idea page header reflowed (actions row under the title, full-width Schedule on mobile, Back link desktop-only).

Remaining for Workstream B: Playwright screenshot sweep at both breakpoints, contrast fixes (A2-2), and real-device iOS checks.

---

## Workstream C — Codebase, docs & structure cleanup

### C1 — Code hygiene

| # | Task | Notes |
|---|------|-------|
| C1-1 | **Fix lint:** add `src/generated/**` to `globalIgnores` in `eslint.config.mjs` | `npm run lint` currently reports ~19k problems from the generated Prisma client → lint (and the "blocking" CI step) is useless noise today. One line. |
| C1-2 | Delete orphan files (= A2-5) + purge ~30 dead CSS classes from `globals.css`, dedupe the double `.section-title`/`.section-subtitle` definitions (audit F10) | Grep-verified list in AUDIT.md F10. |
| C1-3 | Collapse duplicate token palettes (`--status-*` vs `--success/--error` family), keep one (audit F19) | Mechanical; pick the `--status-*` set or the short set, alias the other temporarily. |
| C1-4 | Merge the two `EmptyState` components (`components/ui/` vs `components/planning/`) | One component, `variant` + optional icon override. |
| C1-5 | Rename `package.json` `"name": "codex"` → `"duet"` | Closes the deferred "product name change" item at the package level. |
| C1-6 | Shared `GoogleSyncResult` type + rail-wrapper component (falls out of A1-3/A3-2) | |

### C2 — Docs cleanup

Current state: `docs/00_current` mixes live docs with two finished plans; `docs/` root holds a completed plan and a 893-line generic JS guide.

| # | Task |
|---|------|
| C2-1 | Archive `PRE_RELEASE_USABILITY_TECH_PLAN.md` → `docs/90_archive/` (all phases complete; referenced files like `idea-card-list.tsx` no longer exist). |
| C2-2 | After A0-2 merges: archive `docs/Duet Mobile Wins Plan.md` → `docs/90_archive/` with a one-line completion note (and the `Duet Mobile Wins.html` mockup if present locally). |
| C2-3 | Refresh `rollout_plan.md`: mark U-5 complete; collapse the Feb cycle into a short "done" section; carry forward only T-1..T-3, D-1..D-3 (now owned by this plan); link here as the active milestone doc. |
| C2-4 | Archive or delete `docs/JS_WEB_DEV_GUIDE.md` (generic guide, not project documentation). |
| C2-5 | Fold the env-var setup from `PHOTO_UPLOAD_SPEC.md` into `DEPLOYMENT.md`, then archive the spec. |
| C2-6 | Move root `AUDIT.md` → `docs/00_current/AUDIT_2026-06.md`; update `READ_THIS_FIRST.md` read order (this plan becomes item 4; drop archived docs). |
| C2-7 | Record structural decisions (actions.ts extraction, timezone approach) in `DECISIONS.md`/ADRs per `CLAUDE.md`. |

---

## Suggested execution order

1. **A0** (merge + deploy + Cloudinary env) — gets every shipped fix in front of users.
2. **A1** (user-reported mobile fixes) — one PR, all S-sized.
3. **C1-1 + A2** (lint fix first so CI is meaningful, then audit quick wins) — one or two PRs.
4. **A3-1/A3-2** (form parser + actions extraction) — before any further event-form work.
5. **B** (design review with live screenshots) — feeds the next polish cycle.
6. **C2** (docs cleanup) + remaining **A3** items.
