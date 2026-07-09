# Duet Revival Plan

Created: 2026-07-09 · Status: **awaiting Checkpoint 1 approval**

This is the step-by-step technical plan for bringing Duet back to a healthy state and shipping the email-invites feature set. It is designed to be followed one phase per session. Documentation actualization and repo hygiene planning were done directly (see `REVIVAL_LOG.md`); everything below is **planned, not yet implemented**.

How to read this document:
- ⛔ = hard checkpoint — wait for Yevhenii's explicit approval before proceeding.
- ❓ = Q&A session — a short list of concrete questions to answer together before/during the phase; answers get recorded in `docs/00_current/DECISIONS.md`.
- 📸 = screenshot review loop — visual conversation driven by live screenshots (protocol in Appendix A).

---

## 0. Reality check — how the codebase differs from the brief's assumptions

The revival brief was written assuming a stale, untested codebase with abandoned Google work. A fresh audit (June 2026, `AUDIT.md` + its July status addendum) plus verification of the current tree shows a healthier picture. **Plan adjustments follow from these facts:**

| Brief assumption | Actual state | Consequence for the plan |
|---|---|---|
| "Incomplete Google sign-in / Google licensing work" | There is **no Google sign-in**. What exists is a **complete, merged Google Calendar integration**: OAuth connect, freebusy sync (partner busy-time), and outbound event push that already adds the partner as an attendee — Google then emails them a real invite. It has the best error contract in the app (graceful degradation, structured sync results). | **Nothing to strip.** Keep the integration. Phase 4's email/.ics path complements it for the partner who has *not* connected Google. One design question falls out: avoiding double invites (see Phase 4 ❓). |
| "No email infrastructure" | `src/lib/email.ts` already sends via Resend (fetch-based, no SDK) for password reset, with a console fallback when `RESEND_API_KEY` is unset. `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `NEXT_PUBLIC_APP_URL` are already in `.env.example` and documented in `DEPLOYMENT.md`. | Phase 4 builds a small mail module *around* this instead of introducing a provider from scratch. Checkpoint 2 shrinks to: create Resend account, verify domain, set env vars. |
| "No .ics capability" | `src/lib/ical.ts` generates a valid export feed (`/api/spaces/[spaceId]/calendar.ics`) with correct escaping/folding/CRLF — but it is `METHOD:PUBLISH`, floating local times, no ORGANIZER/ATTENDEE/SEQUENCE. | Phase 4 needs an **invite-grade** ICS builder (METHOD:REQUEST/CANCEL, TZID, SEQUENCE), reusing the existing escaping/folding helpers. |
| "Open mobile bugs" | Several backlog bugs appear **already fixed in code** but the fixes may not be deployed: memories cards do link to event pages, the mobile FAB has a "Block time" item, blocks are editable from the mobile agenda, and the mobile calendar was redesigned (month strip + agenda, June). | Phase 2 becomes **repro-first**: verify each bug against a fresh build before writing any fix. |
| "No tests" | True. Playwright is a devDependency but has no config, no tests. CI runs lint + typecheck + build (blocking). | Phase 1 adds the smoke-test layer (rollout items T-1..T-3). |
| Repo is stale | 40+ local branches (~38 already merged), `feat/whats-ahead-redesign` (current, green, pushed) is **not merged to master**, and two other branches are unmerged. `package.json` name is still `"codex"`. | Checkpoint 1 includes branch disposition; hygiene includes the rename. |

Baseline verified 2026-07-09 on `feat/whats-ahead-redesign`: `npx tsc --noEmit` ✅ · `npm run lint` ✅.

---

## Working agreement (applies to every phase)

- One branch per phase: `hygiene`, `mobile-bugs`, `design-pass`, `email-invites`. Merge to `master` only after the phase gate passes **and** Yevhenii approves the PR.
- Phase gate: `npm run lint` + `npx tsc --noEmit` + `npm run build` + (from Phase 1 onward) `npx playwright test` all green.
- `REVIVAL_LOG.md` updated at the end of every phase: what was done, removed, deferred; root causes for every bug fix.
- Nothing is deleted without a written justification; anything uncertain is flagged, not deleted.
- Significant decisions → `docs/00_current/DECISIONS.md` (dated entry) per `CLAUDE.md`.

---

## ⛔ Checkpoint 1 — approvals needed before Phase 1

1. **Merge `feat/whats-ahead-redesign` → master.** It contains the What's-ahead card redesign, the mobile calendar month strip, and the idea-edit place fix. It is green and pushed; production is behind without it.
2. **Approve the deletion list** (Phase 1, item 1 below).
3. **Branch disposition:** delete the ~38 merged local branches; decide fate of the two unmerged ones — `codex/ui-enhancements` and `feature/p0-2-revert-idea-on-event-delete` (the latter's feature already exists on master via another path; likely obsolete — needs a 5-minute diff review).
4. **Confirm the Google decision:** keep Google Calendar integration as-is (case: *working in production, nothing unfinished found*); email/.ics is additive, not a replacement.

---

## Phase 1 — Hygiene (branch: `hygiene`)

### 1. Deletion / cleanup list (requires Checkpoint 1 approval)

| # | Item | Justification |
|---|---|---|
| H1 | ~30 dead CSS classes in `globals.css` (list grep-verified in AUDIT.md F10) + de-duplicate the double `.section-title` / `.section-subtitle` definitions (lines 197 vs 578 — the second silently wins) | Zero references in `src/`; the duplicate makes edits to the first definition no-ops |
| H2 | Collapse the duplicate feedback palettes (`--status-success*` vs `--success*`, AUDIT F19 token part) — keep one, migrate references | Two subtly different green/red ramps in production |
| H3 | Merge the two `EmptyState` components (`components/ui/` vs `components/planning/`) into one with a `variant` prop | Same component maintained twice |
| H4 | `package.json` `"name": "codex"` → `"duet"` | Closes the long-deferred rename at package level |
| H5 | Define one shared `GoogleSyncResult` import (type already exists in `lib/integrations/google/events.ts`); remove the ~7 inline re-declarations (AUDIT F18) | Drift risk when the sync result changes |
| H6 | Prune merged local branches (post-approval) | 38 branches of noise |
| **Flagged, NOT deleted** | Redirect shims (`notes/`, `planning/`, `ideas/` list page, `inbox/` route) | They keep old links/bookmarks working; cost is near zero |

### 2. Dependencies
- `npm audit` + `npm outdated`; apply **patch/minor** updates only; list any major-version findings in the PR description for approval instead of upgrading. (Stack is recent — Feb 2026 lockfile, Next 16 / React 19 / Prisma 7 / Tailwind 4 — expect a small set.)
- Every dependency in `package.json` is confirmed used (verified against imports in the June audit); no removals expected.

### 3. Smoke tests (rollout T-1..T-3, kept green from here on)
- `playwright.config.ts` + `tests/helpers/auth.ts` (register/seed a test user + space).
- `tests/auth.spec.ts`: register → onboarding; login ok → calendar; login bad → inline error; logout → login page.
- `tests/planning.spec.ts`: create event → appears on calendar; create idea → appears in rail; schedule idea → event exists; delete event → idea reverts to NEW.
- Add `npx playwright test` to CI (needs a Postgres service container or a Neon branch DB — decide in-phase, smallest thing that works).

### 4. Formatting/linting
- ESLint flat config exists and is CI-blocking — no new tooling needed. **Recommendation: do not add Prettier now** (would touch every file and pollute PR diffs mid-revival; revisit after Phase 3 if wanted).

### 5. Carried-over structural item (optional within this phase, else Phase 3 prep)
- Extract inline server actions from `calendar/page.tsx` (859 lines) and `events/[eventId]/page.tsx` (806 lines) into co-located `actions.ts` files (rollout D-2/D-3, AUDIT F4). This is the audit's top restructure and makes every later phase safer. If time-boxed out, it must land before Phase 4 touches event mutations.

**Exit gate:** lint + typecheck + build + new smoke tests green; `REVIVAL_LOG.md` updated; PR merged.

---

## Phase 2 — Mobile bug squash (branch: `mobile-bugs`)

**Protocol — repro before fix.** Production may simply be behind master. Step zero: after Checkpoint 1's merge deploys, re-test every backlog bug on the deployed build (or a local prod build) at 390px and 360px before writing any code.

### Backlog mapping (brief bug № → current knowledge)

| № | Bug | Current evidence | Likely path |
|---|---|---|---|
| 1 | Memory click doesn't navigate (highest prio) | Code *has* the link: `memories-client.tsx:446` → `/events/[id]?from=memories`. Either fixed-but-undeployed, or an overlay/stacking bug swallows the tap (filter chip rail? card inner elements?). | 📸 Repro on device widths; if reproducible, inspect stacking context / pointer-events; root cause to log. |
| 2 | Button positioning off / cutoff | FAB↔rail overlap was partially fixed (rail end-padding, June). Remaining candidates: safe-area insets (`env(safe-area-inset-*)` is used — verify everywhere fixed elements exist), horizontal overflow on narrow content. | 📸 Need Yevhenii's screenshot of the actual cutoff to target it (real-device iOS quirks can't be fully emulated). |
| 3 | No "block" option in mobile "+" menu | `FloatingActionButton.tsx:36-38` has a Block item → `?action=block` (shipped in PR #40). | Verify deployed + the `action=block` param actually opens the modal; fix discoverability only if user still can't find it. |
| 4 | Calendar unusable on mobile | Redesigned June: agenda + collapsible month strip, day-tap filtering (DECISIONS 2026-06-11/12). | ❓ Session: is the *current* (post-redesign) mobile calendar still bad, and specifically what? Fresh screenshots first — don't re-fix the old version. |
| 5 | General mobile pass | — | 📸 Full sweep at 390/360 across: landing, login, register, forgot/reset password, onboarding, calendar (agenda + month strip + day view), event detail, idea detail, memories, activity, settings. Checklist per screen: layout breakage, tap targets ≥ 44px, text overflow, keyboard behavior on inputs. |

### Known open mobile items from the audit to fold into the sweep
- F15: event detail renders outside the space shell — no bottom tabs/FAB on the app's most-visited screen. (Moving the route or wrapping it in the shell is an IA decision → ❓.)
- F13 remainder: activity search is desktop-only and only searches the current page; Memories year filter hidden on mobile.
- F7/F20 remainder: desktop hover-only action reveal on idea cards (no `focus-within`); 32px action buttons on desktop cards.

**Exit gate:** every backlog bug either fixed (root cause logged) or documented as not-reproducible-post-deploy; smoke tests green; PR merged.

---

## Phase 3 — Design & UX pass (branch: `design-pass`)

Run as **three iterative 📸/❓ sub-sessions**, each: screenshots → questions → decision → implement → re-screenshot (before/after pairs saved to `docs/screenshots_<date>/`).

### 3a. Tokens & consistency
- Unify on the CSS-variable token sheet; migrate the 35 files hardcoding `rose-*`/`amber-*`/`slate-*` Tailwind palette classes to tokens (AUDIT F19). Mechanical once H1/H2 landed.
- Audit spacing + type scale usage against the tokens; kill one-off values found in the sweep.
- ❓ **Questions for Yevhenii:** keep the current rose/amber/cream identity as-is (tokens just formalize it), or take the opportunity to tune anything (accent hue, contrast, density)?

### 3b. Card/block redesign (ideas / events / busy blocks)
- Deliver **2–3 variants as a single static HTML mockup page** (same technique as the June "Duet Mobile Wins.html" reference — one file, every variant side by side at mobile width, openable in any browser). Candidate axes: date-block vs photo-led left rail; metadata density; accent stripe vs filled header; block rows vs block chips.
- ❓ **Decision session with screenshots:** pick one variant (or a hybrid); criteria = scanability of a week at a glance + one-thumb ergonomics.
- Implement the winner across `PlanCard`, `IdeaCard`, agenda rows, and `DayCell` bubbles so desktop/mobile stop drifting.
- Note: the June redesign already moved mobile cards to "pure tap target → detail page" — variants should build on that model, not reintroduce inline buttons.

### 3c. Empty states + first-run (the girlfriend-joins-first-sees-this pass)
- Inventory every screen's empty state: calendar (exists — grid + banner), memories, activity, ideas rail, settings, event/idea detail edge cases. Fill gaps with intentional empties: one sentence of purpose + one CTA.
- First-run: walk the actual join-via-invite flow as user #2. Onboarding tour exists (`OnboardingTour`, persisted dismissal) — verify it triggers correctly for the *joining* partner (not just the space creator) and that the first screen they land on answers "what is this and what do I do first".
- ❓ **Questions:** what should partner #2's very first prompted action be — add an idea (lowest friction) or set availability? Any copy/tone preferences (playful vs neutral)?

### 3d. Loading & error states
- Inventory: per-route `loading.tsx` exists for some routes; toasts via `sonner` exist for sync warnings. Fill gaps: every async mutation gets pending state (button-level) + error surface (toast or inline); every route gets a skeleton or explicit fast-render guarantee.
- Verify the audit's F14 fixes covered all Maps-SDK failure paths (ad-blocker case) — search box must show a visible degraded state, not die silently.

**Exit deliverable:** before/after summary (screenshot pairs + one-paragraph rationale per change) appended to `REVIVAL_LOG.md`.

---

## Phase 4 — Email invites & notifications (branch: `email-invites`)

### ⛔ Checkpoint 2 — account/env setup needed from Yevhenii

Everything below is implementable and testable **without** these (dev mode logs emails to console); they gate production sending only:
1. Resend account + **API key** → `RESEND_API_KEY` (Vercel env).
2. **Verified sending domain** in Resend (or use Resend's shared test domain short-term) → `RESEND_FROM_EMAIL`, e.g. `Duet <invites@yourdomain>`.
3. Confirm `NEXT_PUBLIC_APP_URL` is set to the production URL (already required by password reset).

### Implementation plan

**4.1 Mail module** — promote `src/lib/email.ts` into `src/lib/mail/`:
- `index.ts`: provider-agnostic `sendMail({to, subject, html, text, attachments?, headers?})`; keep the dev console fallback.
- `resend.ts`: current fetch implementation + **attachment support** (Resend accepts base64 `attachments: [{filename, content}]`) — needed for `.ics`.
- `templates/`: small typed HTML template helpers (shared layout, button, event summary block). No template engine — string builders like the existing password-reset email.
- Password reset switches to the module (behavior unchanged).

**4.2 Magic-link sign-in** (alternative to password auth, enables email-only accounts):
- Prisma: `MagicLinkToken` model mirroring `PasswordResetToken` (hashed token, 15-min expiry, single-use).
- `POST /api/auth/magic-link` (request; always-generic response like forgot-password; rate-limited via existing `auth-rate-limit.ts`) and `GET /auth/magic/[token]` (verify → create `cm_session` via existing session lib → redirect to space or onboarding).
- Login page gets a "Email me a sign-in link" secondary action. Register-via-magic-link creates the account on first verification (name asked on landing).
- ❓ **Question:** should invite emails to a not-yet-registered partner embed a magic link that both creates the account *and* joins the space (replacing the manual invite code for the email path)? (Recommended — it's the zero-friction join story.)

**4.3 Event invite emails with `.ics`:**
- New `src/lib/ics-invite.ts` reusing `ical.ts`'s escaping/folding: `METHOD:REQUEST`, stable `UID` = `${event.id}@duet.app` (matches the existing export feed — same event, same UID, calendars deduplicate), `ORGANIZER`/`ATTENDEE` mailto with `PARTSTAT`, `DTSTART;TZID=…`, `SEQUENCE`.
- Prisma: `icsSequence Int @default(0)` on `Event`; bump on every time/place/title change; `METHOD:CANCEL` + `STATUS:CANCELLED` email on delete.
- **Timezone prerequisite** (audit F8/F22, the one remaining structural gap): store an IANA timezone on the couple space (settings field, default from creator's browser). Events are already stored as correct instants; the TZID is needed for correct all-day handling and DST-proof display in the invite. ❓ **Decision to confirm:** space-level timezone (recommended for a couple in one city) vs per-user.
- Dispatch: after event create/update/delete server actions (post-`googleSync`), fire-and-forget with logged failures — email problems must never fail the save (same contract as Google sync).
- ❓ **Double-invite rule to decide:** when the organizer has Google Calendar connected with events scope, the partner *already* gets a Google-native invite (attendee push, shipped). Options: (a) suppress the Duet email when a Google invite went out — recommended; (b) always send both; (c) per-user preference.

**4.4 Idea notification emails:** on idea creation, short template (title, note excerpt, who, deep link to `/spaces/[spaceId]/ideas/[ideaId]`) to the partner. Respect preferences; batched digest is out of scope (stub).

**4.5 Notification preferences:**
- Prisma: `emailNotifications Boolean @default(true)` on `CoupleSpaceMembership` (per-user-per-space); Settings row with toggle. Applies to idea emails + non-invite notifications; calendar invites follow the 4.3 rule.
- Weekly digest: **stub only** — preference enum includes `WEEKLY_DIGEST` but is disabled in UI with "coming soon"; noted in log. (A digest needs a cron job — Vercel cron is easy but it's new infrastructure; not worth it this cycle.)

**4.6 Validation & testing:**
- Unit test (Playwright's test runner or a plain `tsx` script in `tests/`): generated `.ics` has CRLF endings, ≤75-char folded lines, required properties (UID/DTSTAMP/DTSTART/ORGANIZER/ATTENDEE/METHOD/SEQUENCE), correct escaping, TZID present for timed events, VALUE=DATE for all-day.
- Round-trip check of UPDATE (SEQUENCE bump) and CANCEL payloads.
- **Manual test for Yevhenii:** create a real event with your girlfriend's real email as partner → confirm the invite lands in her Gmail as an actual calendar invite (RSVP buttons, correct local time), then edit the event time → confirm the calendar entry updates, then delete → confirm cancellation.

**Exit gate:** smoke tests + ICS validation green; invite/update/cancel verified against Gmail + one Apple Calendar; log updated.

---

## Deferred (notes only — do not implement)

| Item | Note |
|---|---|
| Full two-way Google Calendar sync | Only if `.ics` proves insufficient. Inbound freebusy + outbound push already exist. |
| Saving places on ideas/events | Start would be URL + map-link field. NB: rich place data (Google Places) already exists on events/ideas — "saving places" here means a lightweight manual alternative. |
| Multi-user / group expansion | Schema is membership-based so not blocked, but all UX assumes two people. |
| Weekly digest emails | Stubbed in Phase 4.5; needs cron. |
| Infinite scroll for Activity/Memories; server-side full-history activity search | Carried from June plan (A3-4/A3-5). |

---

## Appendix A — Screenshot review protocol (📸)

Local loop (Claude-driven):
1. `npm run dev` + seed realistic data: `npx tsx scripts/seed-demo.ts <spaceId> --reset`.
2. Drive the app via Claude for Chrome (or the built-in preview browser) at 390×844 and 360×800 viewports; capture per-screen screenshots.
3. Post screenshots inline in chat with 2–4 **concrete, closed** questions per session (e.g. "Variant B loses the creator avatar on 360px — acceptable?"), never "thoughts?".
4. Yevhenii answers; implement; re-shoot the same screens; before/after pairs saved under `docs/screenshots_<date>/`.

Yevhenii-provided (things emulation can't catch): real-device iOS Safari — safe-area insets in landscape, keyboard-open layouts, scroll bounce, PWA/home-screen if used. Needed for Phase 2 №2 and the end of Phase 3.

## Appendix B — Manual actions checklist for Yevhenii

- [ ] **Now:** Checkpoint 1 approvals (merge, deletion list, branches, Google decision).
- [ ] Phase 2: provide the button-cutoff screenshot from your phone; real-device retest after fixes.
- [ ] Phase 3: answer the ❓ sessions (card variant pick, first-run priorities, tone).
- [ ] Phase 4 (Checkpoint 2): create Resend account, verify sending domain, set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` in Vercel, confirm `NEXT_PUBLIC_APP_URL`.
- [ ] Phase 4: run the real-address invite test (create/edit/cancel against a real Gmail).
- [ ] Each phase: approve + merge the phase PR.
