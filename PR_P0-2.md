# P0-2: Revert Idea on Event Deletion

## Summary
When an event created from an idea is deleted, the linked idea is now automatically restored to a visible, editable state.

## Changes Made
- Modified `deleteEvent()` in `src/lib/events.ts` to:
  - Load `originIdeaId` and `coupleSpaceId` before deletion
  - Revert linked idea by setting `convertedToEventId = null` and `status = NEW`
  - Add change log entry for idea restoration
  - Gracefully handle case where idea no longer exists

## Implementation Details
1. Enhanced `deleteEvent()` to select `originIdeaId` and `coupleSpaceId` from the event
2. Added conditional logic to revert idea if `originIdeaId` exists:
   - Updates idea: `convertedToEventId = null`, `status = NEW`
   - Creates change log entry: "Idea restored (event deleted)."
   - Wrapped in try-catch to prevent deletion failure if idea is missing
3. Preserved all existing behavior:
   - Comment deletion still occurs first
   - Event deletion still happens
   - Event deletion change log still created
   - Authorization checks remain unchanged

## Edge Cases Handled
- ✅ If linked idea no longer exists, deletion continues without error
- ✅ If idea update fails for any reason, event deletion still completes
- ✅ Authorization is enforced (covered by existing checks)
- ✅ Events without `originIdeaId` are unaffected

## Manual Testing Checklist
- [ ] Create a new idea
- [ ] Schedule the idea to create an event
- [ ] Verify idea status changes to PLANNED and disappears from "New Ideas"
- [ ] Delete the event
- [ ] Verify idea reappears in "New Ideas" with status NEW
- [ ] Verify idea has `convertedToEventId = null`
- [ ] Check activity log shows "Idea restored (event deleted)"
- [ ] Test deleting an event that was NOT created from an idea (should work normally)
- [ ] Test edge case: manually delete idea in DB, then delete event (should not fail)

## Files Changed
- `src/lib/events.ts`

## Related Documentation
- Technical plan: `docs/00_current/TECH_PLAN_P0-2.md`

## Screenshots/Demo
_(Add screenshots after manual testing if desired)_

---

**Ready for review!** This implements the P0-2 technical plan exactly as specified.
