# Decisions

This file records high-level decisions and trade-offs. Add dated entries as they are made.

## Format
```
## YYYY-MM-DD - Decision Title
- Context:
- Decision:
- Alternatives considered:
- Consequences:
```

## 2026-01-30 - Mutation-level authorization checks (P0-1)
- Context: 13 mutation functions in `src/lib/` executed writes without verifying space membership. Authorization relied solely on call-site checks (page layouts, API routes). `deleteNote()` had no author check.
- Decision: Add inline membership verification to every mutation. Use `getCoupleSpaceForUser` for space-scoped creates, `findFirst` with membership WHERE for entity-scoped mutations. `deleteNote()` gets both membership + author check. Both partners can edit/delete shared planning content (events, ideas); only the author can delete their own notes.
- Alternatives considered: Shared middleware/wrapper function — rejected to avoid a new abstraction for a straightforward pattern. Prisma middleware — rejected as too implicit and harder to reason about per-function.
- Consequences: Defense in depth — legitimate callers that already check membership will pass both checks. `deleteEvent`/`deleteIdea` now check before child note deletion, preventing unauthorized data destruction. UI follow-up needed: hide delete button on partner's notes (P1-4 scope).

## 2026-01-30 - Revert idea on event deletion (P0-2)
- Context: When users deleted an event that was scheduled from an idea, the idea remained in PLANNED status with `convertedToEventId` pointing to a non-existent event. Users had no way to recover or re-schedule these "buried" ideas.
- Decision: Enhanced `deleteEvent()` to automatically revert linked ideas by setting `convertedToEventId = null` and `status = NEW`. Added a changelog entry "Idea restored (event deleted)" for transparency. Wrapped in try-catch to gracefully handle missing ideas without blocking event deletion.
- Alternatives considered: Manual idea recovery UI — rejected as it adds complexity and doesn't match user expectations. Leave idea in PLANNED state — rejected as it creates permanent data loss.
- Consequences: Ideas now automatically return to "New Ideas" list when their linked event is deleted, matching natural user mental model. Activity log provides transparency. Edge case of missing ideas handled gracefully.

## ADR Index
- ADR-2026-01-30-custom-session-auth.md
- ADR-2026-01-30-tags-json-string.md
- ADR-2026-01-30-mutation-auth-checks.md

## Links
- READ_THIS_FIRST.md
- docs/00_current/ARCHITECTURE.md
- docs/00_current/CONTEXT.md
- docs/00_current/rollout_plan.md
