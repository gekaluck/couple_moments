Duet UI/UX Fixes — Round 5 Technical Spec
Date: Feb 9, 2026
Focus: Naming, navigation, event detail meta section, calendar legend, busy block attribution, plan card styling, header bar context

What Improved Since Round 4

✅ Event header metadata pills → plain text with · separators (looks great on "City lights stroll")
✅ IDEA / SHARED PLAN badges removed from planning cards
✅ Memories filter section redesigned — search + dropdowns on one row, count simplified to "16 memories", subtitle removed
✅ Tags moved to second line on event detail header, muted outline style
✅ Rating section now integrated into event header area (hearts visible on City lights stroll)
✅ MEMORY PHOTOS → PHOTOS label simplified
✅ Planning cards are cleaner without badge clutter


1. Rename "Upcoming Momentum" → Something Better (P1)
Problem
"Upcoming momentum" is awkward phrasing. "Momentum" implies ongoing progress or velocity — it doesn't naturally describe a list of plans and ideas for a couple. Users would never say "let me check our momentum." It reads like startup jargon.
Fix — Rename to "What's ahead"
Options in order of preference:

"What's ahead" — warm, natural, forward-looking. Feels like something you'd say to your partner.
"Coming up" — simple, casual, clear.
"Our plans" — direct, no ambiguity.

Recommendation: "What's ahead" with the subtitle area removed (it was already removed). The section label above can change from PLANNING to just be omitted, since the page title is self-explanatory.
What's ahead                                        TODAY
──────────────────────────────────────────────────────────
New ideas (1)                              Create idea
...
All upcoming plans (3)                     New event
...
Update the nav or any references to this section accordingly.

2. Remove "TODAY" Button from Planning Page (P0)
Problem
The "TODAY" button on the planning page (next to "New event" in the plans section header) scrolls or filters to today's plans. But there's no way to go back to the full list after clicking it. This is a dead-end interaction — the user clicks "TODAY", the view changes, and they're stuck.
Fix
Remove the "TODAY" button entirely. The planning page should always show all upcoming plans. If the user wants to see what's happening today, the calendar (which is right above on the same page) already serves that purpose. Having a "today filter" on a short list of 3–5 plans adds complexity without value.
If filtering by date range is eventually needed (e.g., "this week" / "this month"), implement it as a proper filter dropdown with a clear way to reset. But for now, just remove it.

3. Add Subtle Accent to Plan Cards (P1)
Problem
Plan cards on the planning page are now clean white cards, but they look almost identical to idea cards (which have a yellow tint). The plans section could use a subtle visual warmth to signal "these are your confirmed dates" without going back to the old heavy pink backgrounds.
Fix
Add a subtle left border accent to plan cards:
css.plan-card {
  border-left: 3px solid var(--color-primary, #D94F5C);
  /* existing styles... */
}
This is the standard pattern for accented list items — it adds just enough color to distinguish plans from ideas without making them look like error cards. The 3px coral/rose left border will create a gentle warm rhythm down the page.
Do NOT add background color. Keep the card background white. The left border alone carries the distinction.

4. Header Bar — Show Today's Events Instead of Just the Date (P1)
Problem
The top navigation bar currently shows FEB 9 as a static date indicator next to the space name. This is useful but underutilized — the user already knows today's date from their phone/computer. The header could surface more actionable context.
Fix
Replace the static date with a contextual event indicator:

If there are events today: Show Feb 9 · Dinner at 5 PM or Feb 9 · 2 plans today
If no events today: Show Feb 9 · Nothing planned or just Feb 9 (current behavior)

Implementation:
jsx// In the header/navbar component
const todayEvents = events.filter(e => isToday(e.date));

const headerDateText = todayEvents.length > 0
  ? todayEvents.length === 1
    ? `Feb 9 · ${todayEvents[0].title}${todayEvents[0].time ? ` at ${todayEvents[0].time}` : ''}`
    : `Feb 9 · ${todayEvents.length} plans today`
  : `Feb 9`;
Styling: The event text after the · should be in var(--color-primary) or slightly lighter weight to differentiate it from the date. Keep it compact — truncate the event title if it exceeds ~20 characters.
Make it clickable: Tapping the date/event indicator could scroll to today on the calendar or open the event detail. This turns a passive label into a useful shortcut.

5. Event Detail — Dedicated Info/Meta Section (P0)
Problem
On the event detail page (e.g., "City lights stroll"), the metadata is currently rendered as plain text directly under the title:
Past · Feb 3, 2026 at 7:34 PM · by Gekaluck
date   together
❤️❤️❤️🤍🤍 3/5
While this is cleaner than the old badge pills, it now feels too small and disconnected from the rest of the page. The sections below (description card, Place card, Photos card, Comments card) all have proper card containers with section labels. But the most important metadata about the event (when, who, what kind, how it was rated) just floats as tiny text under the title with no visual container.
This creates an odd hierarchy: the metadata that defines the event gets less visual treatment than the photo upload prompt or the empty comments section.
Fix — Create a proper "Details" info card for event metadata
Add a dedicated card section right below the title that consolidates all event metadata into a structured, scannable layout:
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Status        Past                                      │
│  Date          February 3, 2026                          │
│  Time          7:34 PM                                   │
│  Created by    Gekaluck                                  │
│  Tags          date · together                           │
│  Rating        ❤️❤️❤️🤍🤍  3/5                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
Design approach — key-value list inside a card:
css.event-info-card {
  background: var(--color-surface, #FAF7F5);
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;
  margin-bottom: 24px;
}

.event-info-row {
  display: flex;
  align-items: baseline;
  padding: 6px 0;
}

.event-info-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.event-info-value {
  font-size: 0.95rem;
  color: var(--color-text-primary);
}
What goes in the card:

Status: "Upcoming" or "Past" — plain text, no badge
Date: Human-readable full date (e.g., "February 3, 2026")
Time: e.g., "7:34 PM" or "Anytime"
Created by: Creator name
Tags: Tag pills (small, muted outline style)
Rating: Heart icons + score (for memories/past events) — if no rating yet, show "Rate this date ❤️🤍🤍🤍🤍"

What to remove from the header:

The inline metadata text (Past · Feb 3, 2026 at 7:34 PM · by Gekaluck) moves into the card
Tags move into the card
Rating moves into the card
The header simplifies to just: breadcrumb + title + action buttons

Resulting page structure:
MEMORIES / EVENT                          🔄 ✏️ 🗑️  Back to memories
City lights stroll

┌── Event Details ──────────────────────────────────────┐
│  Status       Past                                     │
│  Date         February 3, 2026                         │
│  Time         7:34 PM                                  │
│  Created by   Gekaluck                                 │
│  Tags         date · together                          │
│  Rating       ❤️❤️❤️🤍🤍  3/5                         │
└───────────────────────────────────────────────────────┘

┌── Description ────────────────────────────────────────┐
│  Notes for city lights stroll.                         │
└───────────────────────────────────────────────────────┘

┌── Place ──────────────────────────────────────────────┐
│  KFC · 1144 S Western Ave         [map]                │
│  ...                                                   │
└───────────────────────────────────────────────────────┘

...
This gives the metadata equal visual weight with other sections and makes the page feel cohesive — every piece of content lives in a card.

6. Calendar — Add Minimal Legend (P1)
Problem
The calendar uses colored dots and bars but there's no legend explaining what each color means. The user sees orange dots, pink dots, orange bars, pink event backgrounds — but unless they remember the system, they can't tell at a glance what's a plan vs. a memory vs. unavailable time.
The old legend was removed (too bulky), but something minimal is needed.
Fix — Inline legend below the calendar header
Add a small, single-line legend directly under the "Build a cozy rhythm..." subtitle text or next to the day-of-week headers:
🔴 Plans    🟡 Busy    🔵 Memories
Implementation:
jsx<div className="calendar-legend">
  <span className="legend-item">
    <span className="legend-dot" style={{ background: 'var(--color-primary)' }} />
    Plans
  </span>
  <span className="legend-item">
    <span className="legend-dot" style={{ background: 'var(--color-secondary)' }} />
    Busy
  </span>
  <span className="legend-item">
    <span className="legend-dot" style={{ background: 'var(--color-text-muted)' }} />
    Memories
  </span>
</div>
Styling:
css.calendar-legend {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
  margin-bottom: 12px;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
This is one line, takes ~20px of vertical space, and immediately clarifies the calendar's visual system.

7. Busy Blocks — Show Initials for Google Calendar Synced Events (P1)
Problem
When a user manually creates an unavailable/busy block in the app, it shows the creator's initials (e.g., "GE" for Gekaluck). But when busy blocks come from Google Calendar sync, they don't show any attribution. This is inconsistent — the partner can't tell whose busy time is whose when looking at synced blocks.
Fix
Always show initials on busy blocks regardless of source. If the busy block comes from Google Calendar, use the initials of the user whose Google Calendar is linked.
Implementation:
jsx// When rendering a busy block on the calendar
const busyBlockInitials = busyBlock.source === 'google_calendar'
  ? getInitials(busyBlock.linkedUser?.name || busyBlock.linkedUser?.email)
  : getInitials(busyBlock.createdBy?.name);

// In the calendar cell
<div className="busy-block">
  <span className="busy-time">{busyBlock.timeRange}</span>
  <span className="busy-initials">{busyBlockInitials}</span>
</div>
The initials should be styled as a small (16px) circle or text badge at the right edge of the busy block bar, matching the existing pattern used for manually created blocks.
Edge case: If both partners have Google Calendar connected and both are busy at the same time, show both initials or stack two small avatar dots.

Updated Priority List
#IssueEffortImpact1Remove TODAY button from planning (2)TinyHigh — fixes dead-end UX2Event detail info card section (5)MediumHigh — cohesive page structure3Calendar legend (6)SmallHigh — usability clarity4Busy block initials for GCal events (7)SmallHigh — partner attribution5Rename "Upcoming momentum" → "What's ahead" (1)TinyMedium — better naming6Plan card left border accent (3)TinyMedium — visual distinction7Header bar event indicator (4)MediumMedium — contextual awareness8Fix broken Place photos (carried from R4)SmallMedium — broken images9Fix broken City lights stroll thumbnail (carried from R4)SmallMedium — broken images

Cumulative Progress Tracker
Completed (Rounds 1–4):

✅ Calendar badge overload → subtle dots
✅ Snapshot section → removed entirely
✅ Purple search button → removed
✅ Cloudinary error → hidden
✅ Note type badges → unified muted style
✅ Note delete icons → demoted
✅ Memory "Repeat" buttons → removed
✅ Comment section → collapsed input
✅ Event detail → full-width single column
✅ Place section → side-by-side with collapsed hours
✅ Empty description → inline placeholder
✅ Planning subtitle → removed
✅ Memory placeholders → gradient + camera icon
✅ Event header → plain text metadata (no pills)
✅ IDEA / SHARED PLAN badges → removed
✅ Memories filter → single-row compact layout
✅ MEMORY PHOTOS → PHOTOS label
✅ Rating → integrated into header area