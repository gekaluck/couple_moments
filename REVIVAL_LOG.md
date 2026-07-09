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

## Phase 1 — Hygiene

_Not started._

## Phase 2 — Mobile bug squash

_Not started. Root causes will be recorded here per fix._

## Phase 3 — Design & UX pass

_Not started. Before/after summary will live here._

## Phase 4 — Email invites & notifications

_Not started._
