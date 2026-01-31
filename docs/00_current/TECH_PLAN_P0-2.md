# Technical Plan - P0-2 (Revert Idea on Event Deletion)

**Status:** ✅ COMPLETED (2026-01-30)
**PR:** feature/p0-2-revert-idea-on-event-delete

## Goal
When an event created from an idea is deleted, the linked idea is restored to a visible, editable state by clearing `convertedToEventId` and setting `status = NEW`.

## Scope
- Code changes only (no schema changes).
- Update `deleteEvent()` to revert the linked idea.
- Preserve existing behavior for events without `originIdeaId`.

## Files to Change
- `src/lib/events.ts`

## Implementation Steps
1. In `deleteEvent(eventId, userId)`:
   - Load the event with `originIdeaId` and `coupleSpaceId` before deletion.
   - Delete related notes (already present).
2. If `originIdeaId` exists:
   - Update the idea:
     - `convertedToEventId = null`
     - `status = NEW`
   - Optionally add a change log entry for the idea (if consistent with existing logging patterns).
3. Delete the event.
4. Keep existing change log entry for event deletion.

## Edge Cases
- If the idea no longer exists, skip the revert without failing the delete.
- If the user is not authorized, the mutation should fail (covered by P0-1 authorization checks).

## Validation / Tests
- Manual:
  - Create an idea, schedule it to an event.
  - Delete the event.
  - Confirm the idea reappears with status NEW and no linked event.

## Rollout
- Ship with P0-1 authorization changes to ensure the mutation is always scoped to the correct space.
