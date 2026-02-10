# Read This First

This is the entry point for contributors and agents.

## Read order
1. [CONTEXT.md](CONTEXT.md) - commands, repo map, coding conventions
2. [ARCHITECTURE.md](ARCHITECTURE.md) - boundaries, data flow, and integrations
3. [DECISIONS.md](DECISIONS.md) - ADR index and decision history
4. [rollout_plan.md](rollout_plan.md) - active delivery milestones
5. [CLEANUP_PLAN.md](CLEANUP_PLAN.md) - active multi-phase cleanup/refactor plan

## What each doc is for
- `CONTEXT.md`: operational working memory for daily development
- `ARCHITECTURE.md`: canonical architecture and integration behavior
- `DECISIONS.md`: links to ADRs and rationale history
- `DEPLOYMENT.md`: production setup and release checklist
- `rollout_plan.md`: milestone progress and backlog status
- `CLEANUP_PLAN.md`: cleanup scope, sequencing, and acceptance criteria

Do not use `docs/90_archive` for current-state decisions unless explicitly requested.

## Handoff contract
- Goal: make focused, reviewable changes aligned to the active milestone.
- Constraints: follow repository rules in `CLAUDE.md`.
- Artifacts: update docs when behavior, architecture, or milestone scope changes.

## Core env reminders
If enabled by feature usage, configure:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Google Calendar OAuth/env keys listed in `DEPLOYMENT.md`
