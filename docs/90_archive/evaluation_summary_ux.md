# UX Evaluation

## UX issues (grouped by screen/flow)
- Onboarding / Invite: Invite flow details are vague; likely unclear success/failure feedback and partner-pending state.
- Calendar (hub): High density plus embedded planning can overwhelm first-time users; quick-add interactions risk accidental opens; no explicit empty state when there are zero events.
- Event creation/edit: Validation feedback appears mostly HTML5; inline error text and field-level guidance are missing; loading states for server actions are not documented.
- Ideas / Planning: Comment, schedule, and delete actions on a single card add cognitive overload; modal stack behavior can be confusing without clear focus management.
- Memories: Filter/search empty results lack guidance; timeline grouping can be unclear when tags or photos are sparse.
- Notes center: Pagination UX likely unclear (Next/Previous only); search/filter affordances under-signaled; empty states not called out.
- Activity: Entries can feel noisy without clear context or strong links; grouped headings may be insufficient for quick scanning.

## Quick wins
- Add explicit empty states across Calendar, Ideas, Memories, Notes, and Activity with a single CTA.
- Add inline validation errors under fields; use toasts for success only.
- Add loading/skeleton states for list-heavy pages (Ideas, Memories, Notes).
- Standardize confirmation dialogs for destructive actions.

## High-impact polish items
- Simplify the first-time experience: show calendar + single primary CTA; progressively reveal planning tools.
- Standardize card layouts (title/meta/actions order) across Ideas/Plans/Memories to reduce scan fatigue.
- Accessibility basics: visible focus states, aria labels on icon buttons, modal focus trap, consistent ESC handling.
- Add a clear “current space” header with onboarding hints and quick actions.
