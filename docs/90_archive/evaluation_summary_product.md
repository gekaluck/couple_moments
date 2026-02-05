# Product & Business Logic Evaluation

**Project:** Couple Moments (date_mvp)
**Evaluator role:** Product & Business Logic Reviewer
**Date:** 2026-01-30
**Inputs:** `docs/00_current/READ_THIS_FIRST.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `rollout_plan.md`, codebase behavior

---

## 1) Product Intent

The system optimizes for **low-friction date planning and shared memory-keeping between two people**. The core loop is:

1. Capture an idea (loose, undated).
2. Schedule it as an event (give it a date).
3. After the date passes, it becomes a memory (rate it, comment, attach photos).

Secondary goals: shared notes, availability awareness, activity feed so both partners see what changed.

The product treats the couple space as a private, equal-membership unit. There is no admin/member distinction, no public surface, and no third-party access. The invite code is the only entry point.

---

## 2) Strengths in Business Logic

- **Idea-to-Event conversion copies all relevant data.** Title, description, tags, and all 9 place fields are carried forward. Comments are migrated from the idea to the new event. The user does not lose context when scheduling.

- **Event type is determined by date, not by manual user action.** `createEventForSpace` auto-assigns `PLANNED` or `MEMORY` based on whether the date is in the past. The calendar and memories pages also use date comparison at render time. This means users never need to manually "mark as done" — the system infers it from reality.

- **Space membership is hard-capped at 2.** `MAX_MEMBERS_PER_SPACE = 2` is enforced at join time. The invite code is checked, duplicate membership is handled gracefully (returns success), and the "space full" case returns a clear error. This prevents the product from drifting into a group-planning tool.

- **Idempotent join.** If a user who is already a member attempts to join again via invite code, the system returns success rather than an error. This prevents confusion from double-clicking or re-sharing the link.

- **Change log captures the important mutations.** Event, idea, and note create/update/delete are all logged. The activity feed merges change log entries with comment activity into a single chronological view. Both partners can see what the other did.

---

## 3) Logical Inconsistencies or Fragile Assumptions

### 3a. Idea becomes permanently invisible after scheduling — even if the event is deleted

When an idea is scheduled, it gets `convertedToEventId` set and `status = PLANNED`. The idea list filters on `convertedToEventId: null`, so the idea disappears. If the linked event is later deleted, the idea remains hidden because `convertedToEventId` still points to the (now-deleted) event ID. The idea is irrecoverable from the UI.

**Why this matters:** A user who deletes a scheduled event expects the idea to "come back" to the backlog. Instead, it vanishes permanently. This will cause mistrust ("where did my idea go?").

**Root:** `deleteEvent()` (`src/lib/events.ts:263-286`) does not clear the linked idea's `convertedToEventId` or revert its status.

### 3b. The `EventType` enum (PLANNED/MEMORY) is set once and never updated, but the UI ignores it

The `type` field is assigned at creation based on date. It never changes — there is no function to update it. The calendar, event detail, and memories pages all determine "past vs. future" by comparing `dateTimeStart` to `new Date()` at render time, making the stored `type` field effectively unused after creation.

**Why this matters:** The `type` field and the runtime date check can disagree. An event created for a future date (`type = PLANNED`) whose date passes stays `PLANNED` in the database but renders as a memory everywhere. This is harmless today because nothing reads `type` after creation, but it's a latent inconsistency. Any future logic that branches on `event.type` (e.g., notifications, exports, analytics) will produce wrong results.

### 3c. Rating is per-event, not per-user — second person silently overwrites

The `Event` model has a single `rating` and `ratedAt` field. Both partners can rate, but the second rating overwrites the first without warning. There is no record of who rated or what the previous rating was.

**Why this matters:** In a couples product, both people's opinions matter. Partner A rates a date 5 hearts; Partner B rates it 2. Partner A sees "2" with no explanation. This creates confusion and potential friction — exactly the opposite of what a couples app should do.

### 3d. Note/comment deletion has no author check

`deleteNote()` (`src/lib/notes.ts:92-107`) accepts a `userId` parameter but does not verify it matches `note.authorUserId`. The UI shows the delete button on all notes regardless of authorship. Either partner can delete the other's notes and comments.

**Why this matters:** In a shared space, users expect to delete their own content but not their partner's. Silently allowing cross-deletion erodes trust. This is distinct from the architectural concern (missing auth check) — the product rule itself is undefined.

### 3e. Comments can only be deleted from the Notes page, not from the entity they belong to

Event and idea detail pages show comments but provide no delete button. The only way to delete a comment is to navigate to the Notes page and find it there. Most users will not discover this path.

**Why this matters:** If someone posts an accidental or incorrect comment on an event, they have no obvious way to remove it. The expected action (delete from where it was posted) is missing.

---

## 4) Risky Edge Cases in Real-World Usage

### 4a. Scheduling an idea, then editing the event's date to the past

If a user schedules an idea for next Saturday, then edits the event date to last Saturday, the event silently becomes a "memory" in the UI (date-based rendering). But the `type` field stays `PLANNED`, and the idea remains in `PLANNED` status with `convertedToEventId` set. The event now exists in the memories view as something that "happened" but was never actually experienced.

**Impact:** Confusing memories timeline. The couple might see events they never went on.

### 4b. Deleting an idea that has been converted to an event

`deleteIdea()` deletes the idea and its comments but does not touch the linked event. The event's `originIdeaId` now points to a deleted record. This is a soft orphan — functionally harmless (the event works fine) but conceptually misleading if any future feature tries to trace lineage.

### 4c. User creates the same idea twice, schedules both

There is no duplicate detection. A user can create "Dinner at Luigi's" twice, schedule both, and end up with two identical events on the calendar. Each idea-to-event conversion is independent due to the `@unique` constraint on `originIdeaId`, so there is no database-level conflict, but the user experience is redundant.

### 4d. Invite code never expires and cannot be regenerated

The invite code is generated once at space creation and has no expiration. If it leaks (screenshot, shared message), anyone with the code can attempt to join. The 2-member cap prevents a third person from joining, but there is no way to revoke or rotate the code.

### 4e. No mechanism to leave a space

Once a user joins a space, there is no leave function, no removal function, and no UI for either. If a couple breaks up or someone joins the wrong space, the only resolution is manual database intervention.

### 4f. Availability blocks have no interaction with event scheduling

Availability blocks exist as a separate concept (`src/lib/availability.ts`) but are never checked when creating or scheduling events. A user can schedule an event during a time their partner marked as unavailable with no warning.

---

## 5) Business Logic Improvements Worth Doing NOW

These address logic that will confuse or frustrate real users on first use.

**A. Revert idea status when its linked event is deleted.**
When `deleteEvent()` runs and the event has an `originIdeaId`, clear the linked idea's `convertedToEventId` and set its status back to `NEW`. This makes the idea reappear in the backlog, matching user expectations.

**B. Define the author-only deletion rule for notes/comments.**
Decide and enforce: can a user delete their partner's notes? If yes, make it an explicit product decision. If no (the expected default for a couples product), add an author check to `deleteNote()` and only show the delete button to the note's author.

**C. Add a delete button for comments on event and idea detail pages.**
Users should be able to delete their own comments from where they posted them. Currently, the only path is through the Notes page, which most users will not discover.

**D. Make the rating system per-user or make the shared nature explicit.**
Either: (a) store two ratings (one per member) and display both, or (b) keep a single rating but show who last rated and display a confirmation prompt when overwriting the partner's rating. The silent-overwrite behavior is the worst option.

---

## 6) Business Logic Improvements Worth Deferring

**A. Reconcile the `EventType` enum with runtime date logic.**
Either remove the `type` field entirely and derive it from date comparison everywhere, or add a scheduled transition/update that sets `type = MEMORY` when a date passes. This is not urgent because no current code path reads `type` after creation, but it should be resolved before adding any feature that depends on event type (notifications, analytics, filtering).

**B. Add invite code rotation/expiration.**
Allow space owners to regenerate the invite code, invalidating the old one. Not urgent because the 2-member cap limits damage, but matters for user trust if the product grows.

**C. Add a "leave space" flow.**
Design what happens to a user's created content when they leave (preserve? anonymize? delete?). This involves product decisions beyond pure logic. Defer until there is real user demand, but acknowledge the gap.

**D. Conflict detection for availability blocks.**
Show a warning when scheduling an event during a time a partner marked as unavailable. This adds real planning value but requires UI coordination beyond pure logic work.

**E. Duplicate idea detection.**
Surface a warning when creating an idea with a title that closely matches an existing one. Low urgency — duplicates are harmless and the expected volume per couple is small.

---

## 7) Explicit Non-Issues (Acceptable As-Is)

- **No auto-transition from PLANNED to MEMORY.** The UI uses date comparison at render time, which produces the correct visual result without needing a background job or cron. The stored `type` field is inert but not harmful today.

- **Ideas are immutable after conversion (no sync back to the event).** This is the correct product behavior. Once an idea becomes an event, the event is the source of truth. Editing the event should not retroactively change the idea. The idea served its purpose as a seed.

- **Events created from ideas can be edited independently.** Correct. The event inherits from the idea at creation time, then lives its own life. Users expect to change the date, title, or location of a scheduled event without restrictions.

- **Comments are migrated from idea to event on conversion.** Correct. The discussion context follows the entity that the user will interact with going forward (the event). Leaving comments orphaned on a hidden idea would lose valuable context.

- **Notes are immutable (no edit, only delete and recreate).** Acceptable at this stage. Notes and comments are short-form content where re-posting is a reasonable correction flow. Edit support would be a polish improvement, not a logic fix.

- **Users can be in multiple spaces.** The schema and queries support this. Even though the primary use case is one couple per user, supporting multiple spaces avoids artificial restrictions (e.g., a user who creates a space before their partner joins).

- **No threading on comments.** The schema supports `replyToNoteId` but the UI does not expose it. Flat comments are appropriate for the expected volume (two users, conversational context). Threading would add complexity without clear value at this scale.

- **Change log does not capture membership changes, reactions, or photos.** These are low-signal events for the activity feed. The current logging of entity create/update/delete and comments covers the actions both partners care about seeing.

---

*This evaluation covers product behavior and business logic only. It does not propose UI redesigns, technical refactors, or new features beyond what is necessary to fix logical inconsistencies.*
