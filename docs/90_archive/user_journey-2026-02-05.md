# Couple Moments: User Journeys (UI/UX Context)

This document summarizes the main user journeys across the current app pages.
Use it to plan UI, UX, and frontend improvements without re-reading the codebase.

## Global entry and navigation
- User lands on login/register, then is redirected into a Couple Space.
- Top nav is persistent across space pages: Calendar, Memories, Notes, Activity.
- Default space landing is the Calendar page, which now includes Planning.

## Calendar (primary hub + Planning)
### Purpose
- The Calendar is the main hub for events and availability.
- Planning (ideas + upcoming plans) is embedded below the calendar grid.

### Main user flow
1) View month grid and scan upcoming events.
2) Click a day cell to open the New Event modal with date prefilled.
3) Create an event via modal (title/date/time/notes/tags).
4) Event appears in that day cell after save.

### Availability blocks
1) Click "+ Unavailable" to open modal.
2) Fill reason/title + start/end dates + optional note.
3) Block appears in calendar cells with creator initials.
4) Click a block to open Edit Unavailable modal and update it.

### Planning area inside Calendar
Left column: "Add a new idea"
- Create idea with title, optional notes, optional tags.

Right column: "Upcoming plans"
- List upcoming events with title and short description.
- Comments badge links to event detail.

Bottom: "New ideas" list
- Shows idea cards with metadata and actions:
  - Schedule as event: opens modal to create event with idea data.
  - Mark done: sets idea to DONE.
  - Delete: requires confirmation.

## Event detail
### Purpose
- Read-only presentation of a single event.
- Edit and delete are controlled by top-right actions.

### Main user flow
1) View event header: status (Upcoming/Memory), date/time, creator, tags.
2) Review description notes.
3) React with emoji reactions (inline chips).
4) Read and post comments (card-based list with initials).
5) Click Edit to open modal with full form fields.
6) Save or delete (delete requires confirmation).

## Memories
### Purpose
- Review past events as memories with optional thumbnails.

### Main user flow
1) Use Year and Tag filters (client-side).
2) Browse memory cards with thumbnail, title, date, snippet, tags.
3) Click memory to open event detail.

## Notes Center
### Purpose
- Central feed for manual notes and linked event/idea comments.

### Main user flow
1) Filter by type: All, Free notes, Linked to events.
2) Search notes by text.
3) Create a new manual note.
4) React to notes and delete (delete requires confirmation).
5) Navigate to linked event/idea from note.
6) Paginate through notes with Next/Previous.

## Activity feed
### Purpose
- Timeline of meaningful actions in the couple space.

### Main user flow
1) View grouped entries by date (Today/Yesterday/date).
2) Scan newest activity first with timestamp and author.

## Ideas (legacy / redirects)
- `/spaces/:spaceId/ideas` now redirects to Calendar.
- Planning is embedded within Calendar; no separate Planning page in nav.
- Inbox route also redirects to Calendar.

## Common friction points and UI considerations
- Calendar cell density: ensure event text remains readable.
- Quick add should not intercept clicks on existing event cards.
- Confirmations should be consistent across deletes (events, ideas, notes).
- Planning embedded in Calendar may be long; consider collapsible sections.
- Notes pagination needs clear position and visibility.
*** End Patch
