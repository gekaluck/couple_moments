# ADR: Mutation-Level Authorization Checks

## Context

13 mutation functions in `src/lib/` (across `notes.ts`, `events.ts`, `ideas.ts`, `availability.ts`) executed database writes without verifying that the caller is a member of the target couple space. Authorization was enforced only at call sites (page layouts, API route handlers). A future call site skipping that check would be a cross-space authorization bypass.

Additionally, `deleteNote()` had no author check — any space member could delete any note.

## Decision

Add authorization checks directly inside each mutation function. Two patterns used:

1. **Space-scoped creates** (`createNoteForSpace`, `createEventForSpace`, `createIdeaForSpace`, `createAvailabilityBlock`): Call `getCoupleSpaceForUser(spaceId, userId)` and throw if null.

2. **Entity-scoped mutations** (`updateEvent`, `deleteEvent`, `updateIdea`, `deleteIdea`, `createEventComment`, `createIdeaComment`, `toggleEventReaction`, `toggleNoteReaction`): Use `prisma.*.findFirst` with `coupleSpace: { memberships: { some: { userId } } }` WHERE clause. Throw if not found.

3. **Author-restricted delete** (`deleteNote`): Membership check + `authorUserId !== userId` check.

For `deleteEvent` and `deleteIdea`, the membership check runs before child `note.deleteMany` to prevent unauthorized data destruction.

No function signatures changed. All callers already pass `userId`.

### Functions secured

| File | Function | Check type |
|------|----------|------------|
| notes.ts | `createNoteForSpace` | Space membership |
| notes.ts | `deleteNote` | Membership + author |
| notes.ts | `toggleNoteReaction` | Entity membership |
| events.ts | `createEventForSpace` | Space membership |
| events.ts | `updateEvent` | Entity membership |
| events.ts | `deleteEvent` | Entity membership (before child deletes) |
| events.ts | `createEventComment` | Entity membership (replaced `findUnique`) |
| events.ts | `toggleEventReaction` | Entity membership |
| ideas.ts | `createIdeaForSpace` | Space membership |
| ideas.ts | `updateIdea` | Entity membership |
| ideas.ts | `deleteIdea` | Entity membership (before child deletes) |
| ideas.ts | `createIdeaComment` | Entity membership (replaced `findUnique`) |
| availability.ts | `createAvailabilityBlock` | Space membership |

### Already secured (no changes needed)

- `createEventPhoto()` — events.ts (entity membership)
- `updateEventRating()` — events.ts (membership via include)
- `updateAvailabilityBlock()` — availability.ts (creator check in WHERE)

## Consequences

- Defense in depth: callers that already verify membership will pass both checks. Redundancy is acceptable.
- `createEventComment` and `createIdeaComment` both check membership, and then call `createNoteForSpace` which checks again. Accepted as defense in depth.
- UI follow-up needed: the notes page shows delete buttons on all notes regardless of authorship. After this change, clicking delete on a partner's note throws. The UI should hide the button for non-authored notes (tracked under P1-4).

## Alternatives considered

- **Shared helper/wrapper function**: Would reduce repetition but adds a new abstraction. The inline pattern matches existing secured functions (`createEventPhoto`, `updateEventRating`) and is easy to audit per-function.
- **Prisma middleware**: Too implicit. Authorization logic should be visible at the point of use.
