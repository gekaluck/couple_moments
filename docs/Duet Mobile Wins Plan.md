# Duet — Mobile Wins: Technical Plan

> Hand-off document for the coding assistant.
> **Reference mockup:** `Duet Mobile Wins.html` — open it to see every screen on mobile + desktop with before/after.
> **Scoping principle:** every change reuses components that already exist in the app. No new fonts, no new color ramps, no new card styles. We are tightening hierarchy and density, not redesigning.

---

## 0. TL;DR — what's changing

| Priority | Screen | Change | Effort |
|---|---|---|---|
| **P0** | Activity (mobile + desktop) | Row redesign: colored left-border (partner) + icon/eyebrow (type) + inline memory preview + filter chips | M |
| **P1** | Memories (mobile) | Card goes from vertical-stack to inline-left thumb — matches desktop | S |
| **P1** | Calendar → "What's ahead" (mobile) | Ideas become a horizontal scroll rail; plans keep list form with colored borders | S |
| **P2** | Settings (mobile) | Partners side-by-side; secondary sections become grouped list rows | S |

Everything else in the app is untouched.

---

## 1. System reference (extracted from current app)

Before touching code, confirm these tokens exist or add them under the existing names. If names differ in the codebase, map to them — don't rename.

### 1.1 Color tokens

```css
/* surfaces */
--bg:          #F7F4EF;   /* app background, warm off-white */
--bg-header:   #FBE9E4;   /* top gradient band */
--card:        #FFFFFF;
--card-warm:   #FEFBF8;

/* borders */
--border:      rgba(40,30,25,0.08);
--border-soft: rgba(40,30,25,0.05);

/* ink */
--ink:         #1F1A17;
--ink-80:      rgba(31,26,23,0.80);
--ink-60:      rgba(31,26,23,0.58);
--ink-40:      rgba(31,26,23,0.40);
--ink-25:      rgba(31,26,23,0.25);

/* brand rose — primary accent (pills, CTAs, active nav) */
--rose:        #CD5242;
--rose-dark:   #A63B2E;
--rose-soft:   #FBE0D8;
--rose-light:  #FDF2EE;

/* amber — busy / ideas */
--amber:       #D68A2A;
--amber-dark:  #A8681A;
--amber-soft:  #FBEBD0;
--amber-card:  #FEF5E0;

/* violet — partner accent (Yiqi in screenshots) */
--violet:      #6D5BC4;
--violet-soft: #E8E3F7;
--violet-card: #EFEBFB;

/* sage — comments (optional, if adopting) */
--sage:        #5A8672;
--sage-soft:   #DCEAE3;
```

**Partner color tokens** are already per-user from Settings → Profile Style. Reference them via the already-existing mechanism (e.g. `user.accentColor`) rather than hardcoding `--violet`/`--amber`.

### 1.2 Type stack

Keep the existing sans. Optionally introduce ONE serif for hero/display moments (Memories + Activity + empty states).

```css
--font-sans:  "Inter", -apple-system, system-ui, sans-serif;
--font-serif: "Fraunces", "Cormorant Garamond", Georgia, serif;  /* display only */
```

**Serif usage policy:**
- H1 of Memories page (`Revisit your highlights`) and Activity page (`What you've been up to`) — **optional**, ship without first, evaluate
- Empty-state display copy
- Memory note pull-quotes inside the Activity row (italic)

All body UI, labels, chips, buttons, metadata stay sans.

### 1.3 Existing components to reuse (don't redesign)

| Component | Where it exists today | What to reuse |
|---|---|---|
| **Pill chip (outline)** | Memories tag filters, calendar legend | filters on Activity, chip rails on mobile |
| **Pill button (solid)** | `Block time`, `New event`, `Create idea` | all primary CTAs |
| **Outline pill** | `+ Event`, `JUMP TO TODAY`, header nav | secondary actions |
| **Timestamp pill** | Calendar day cells (`APR 9, 2026`) | timestamps on Activity rows |
| **Colored-left-border card** | Mobile Calendar list (busy, event) | Activity rows, plan rows |
| **Icon circle header** | "New ideas", "All upcoming plans" sections | section headers |
| **Partner avatar** | Settings members, event `created by` | filter rails, activity meta |

---

## 2. Activity page (P0)

### 2.1 Problem being solved

From user audit: rows are repetitive, hierarchy is weak, day dividers are passive, no sense of "who did this." Current rows all look the same — no way to skim.

### 2.2 Data model

Normalize the feed to a single `ActivityItem`:

```ts
type ActivityType =
  | 'event_created'
  | 'event_updated'
  | 'idea_saved'
  | 'idea_promoted'        // idea → calendar event
  | 'comment_added'
  | 'memory_completed'
  | 'photo_added';

type ActivityItem = {
  id: string;
  type: ActivityType;
  actorId: string;         // resolve to partner color + initial via user table
  timestamp: string;       // ISO
  target: { kind: 'event'|'idea'|'memory'; id: string; title: string; href: string };
  body?: string;           // comment text, idea description
  memory?: {
    rating: 1|2|3|4|5;
    note?: string;
    photoCount: number;
    heroPhotoUrl?: string;
  };
  photos?: { url: string; alt?: string }[];   // for photo_added
};
```

Sort desc by `timestamp`, then group client-side by **local calendar day**. Emit a `DayHeader` between groups.

**Day label rules:**
- Today → `"Today"` + `"Apr 19"`
- Yesterday → `"Yesterday"` + `"Apr 18"`
- Same year → `"Friday"` + `"Apr 3"`
- Prior year → `"Friday"` + `"Apr 3, 2025"`

### 2.3 Row anatomy (mobile + desktop, same component)

```
┌──┬─────────────────────────────────────────────────┐
│  │ 💡 NEW IDEA · Gekaluck            8:40 AM  │
│  │ Pottery class in Gowanus                        │
│  │ Saw this on Yuki's story — Sat mornings, 2hrs.  │
│  │                                                 │
└──┴─────────────────────────────────────────────────┘
 ↑
 partner color (3px left border)
```

**Container:**
- `background: var(--card)`
- `border: 1px solid var(--border-soft)`
- **`border-left: 3px solid {partnerColor}`** ← this is the key visual, reuses the mobile Calendar pattern
- `border-radius: 10px`
- `padding: 12px 14px`
- `margin-bottom: 8px`

**Meta row** (one horizontal line):
- Icon in type accent color — 14px, type-specific (see §2.4)
- Eyebrow label — sans, 11px, weight 600, uppercase, 0.5 letter-spacing, color = type accent
- `·` divider — ink-25
- Partner name — sans, 11.5px, weight 600, color = partner color
- Timestamp pill — pushed right with `margin-left: auto`; existing outline pill, 9.5px uppercase

**Title:**
- sans, weight 600, 15px mobile / 16px desktop, `--ink`, letter-spacing -0.1
- `margin-top: 4px`

**Body** (when `body` present — comments, idea descriptions):
- sans, 13px, `--ink-80`, line-height 1.5
- `margin-top: 6px`
- **No left border** on body (row already has one); just prose. This avoids competing borders.

### 2.4 Type metadata table

| Type | Eyebrow | Icon | Accent color |
|---|---|---|---|
| `event_created` | `PLANNED` | calendar | `--rose` |
| `event_updated` | `UPDATED` | calendar | `--rose` |
| `idea_saved` | `NEW IDEA` | bulb | `--amber` |
| `idea_promoted` | `MOVED TO CALENDAR` | calendar | `--amber` |
| `comment_added` | `NOTED` | comment | `--sage` |
| `memory_completed` | `REMEMBERED` | heart | `--rose` |
| `photo_added` | `ADDED PHOTOS` | camera | `--violet` |

### 2.5 Inline memory preview (when `type === 'memory_completed'`)

Renders inside the row content, below title. Reuses the memory card vocabulary.

- Container: `background: var(--rose-light)`, `border-radius: 8px`, `padding: 8px`, `margin-top: 10px`, `display: flex`, `gap: 10px`.
- Hero photo: 56×56, `border-radius: 6px`, object-fit cover. Fallback = warm striped placeholder.
- Right column (stacked):
  - **Rating:** 5 heart icons, 11px. Filled = `--rose`, empty = `--ink-25`. (Matches the existing heart-rating shown in event detail.)
  - **Note:** sans italic, 12px, `--ink-80`, line-height 1.35, wrapped in curly quotes.
  - **Footer:** sans, 9.5px, uppercase, 0.5 letter-spacing, `--ink-40`, weight 500, text: `"{photoCount} photo{s}"`.

Entire row is clickable → `target.href`.

### 2.6 Photo strip (when `type === 'photo_added'`)

Horizontal 64×64 thumbnails, 6px gap, up to 3 inline. Clip extras (don't show "+N more" — keep it quiet). Clicking opens the event's photo view.

### 2.7 Day header

Replaces current quiet pill:

```
Today  Apr 19
──────────────
```

- sans, weight 700, 14px `--ink`, letter-spacing -0.2
- followed by sans, 12px `--ink-60` subtitle (the date)
- `padding: 16px 0 8px`

### 2.8 Page chrome

**Mobile:**
- Eyebrow: sans 10px, 1.4 letter-spacing, uppercase, `--ink-60`, weight 600 — `"ACTIVITY"`
- H1: existing section header style (weight 700, 22px) — `"What you've been up to"`
- Filter chip rail: horizontal scrollable, first chip active (`--rose` bg). Chips: `All`, `Plans`, `Ideas`, `Memories`, `Photos`, `Notes`
- Bottom tab bar unchanged, `Activity` tab active

**Desktop:**
- Eyebrow + H1 (28px)
- Supporting line: `"Every plan, idea, and memory across your space."`
- Filter rail + inline search input (outline pill with magnifier, "Search activity…"). Right side of rail: both partner avatars + `BOTH` label (no filtering in v1, purely visual confirmation)
- Content max-width 760px, centered

### 2.9 Removals

Kill these existing elements on the Activity page:
- ❌ The large `29 actions · Page 1 / 1 · SHARED TIMELINE · Showing 1–29` header card — replaced by the compact eyebrow + H1
- ❌ Red title color on event names — titles are now `--ink`; color is carried by the eyebrow and left border
- ❌ The `/ EVENT` pill underneath (redundant with the eyebrow)

---

## 3. Memories — mobile (P1)

### 3.1 Problem

Each card is ~500px tall on a ~844px screen. A user sees 1–2 memories per scroll. Too much emotional content hidden behind scroll.

### 3.2 Fix: inline-left thumb (matches desktop)

Card anatomy:

```
┌───────┬────────────────────────────────────────┐
│       │ Dinner at SKY                          │
│ 📷 72 │ (optional subtitle)                    │
│       │ • dinner             APR 3, 2026 (pill)│
└───────┴────────────────────────────────────────┘
```

- Container: `background: var(--card)`, `border-radius: 12px`, `padding: 12px`, `border: 1px solid var(--border-soft)`, `display: flex`, `gap: 12px`, `align-items: center`, `margin-bottom: 8px`
- Thumb: 72×72, `border-radius: 8px`. If no photo uploaded, use a solid `--amber` tile with camera icon (matches current placeholder)
- Right column:
  - Title: sans, weight 600, 14.5px, `--ink`, letter-spacing -0.1, line-height 1.25
  - Subtitle (optional): sans, 12px, `--ink-60`, truncate with ellipsis
  - Meta row: tag pill (existing outline style) + timestamp pill pushed right

### 3.3 Search + filters

Keep as on current mobile, but tighten:
- Search input: single pill, inline magnifier + `"Search memories…"`. Remove the separate `All years` / `All tags` selectors from the hero card — move them into the filter chip rail or push them to an icon-opened filter sheet.
- Filter chip rail: existing chips (`All`, `cozy`, `dinner`, etc.) — horizontally scrollable, uses existing pill chip component.

### 3.4 Hero simplification

- Keep: eyebrow (`MEMORIES · 8`), headline (`Revisit your highlights`)
- Remove: the 8-memories count card style; let the eyebrow carry the count

---

## 4. What's Ahead — mobile (P1)

### 4.1 Problem

Currently three full-width cards stacked: ideas header → 1 idea card → plans header → 2 plan cards. User scrolls through a lot of whitespace to see what's coming.

### 4.2 Fix

**Ideas block:** horizontal rail of idea cards (240px wide, snap-scroll).
- Section header row: icon-circle (bulb in amber) + title `"Ideas"` + count `"3 on the shortlist"` + `+ Add` text button on the right
- Rail cards: existing `--amber-card` background, existing tag-pill treatment, 240px min-width
- Snap: `scroll-snap-type: x mandatory` on the rail, `scroll-snap-align: start` on each card
- Shows ~1.2 cards on screen → clear affordance to scroll

**Plans block:** keep as list, but adopt the colored-left-border row pattern (same component family as Activity rows, different content).
- Section header: icon-circle (calendar in rose) + title `"Upcoming plans"` + count + `New event` solid pill CTA on the right
- Each plan: `--rose-light` background, `border-left: 3px solid var(--rose)`, title/body/meta layout

This removes about 40% of vertical space on the first scroll.

### 4.3 Don't touch

The overall "What's ahead" parent card pattern, the section ordering, the CTAs' labels — all stay.

---

## 5. Settings — mobile (P2)

### 5.1 Problem

Current: 5 stacked full-width cards for Members, Invite code, Space info, Profile, Calendar prefs. Heavy scroll, weak scannability.

### 5.2 Fix

**Top:** eyebrow + H1 as on other pages.

**Partners card:** keep as a card, but make the two members sit **side-by-side** (2-col flex within the card) instead of stacked. Each is a 10px-padded soft-tinted chip with avatar + name + role. Half the vertical space.

**Everything else:** one grouped list with list rows.
- Container: single rounded card with internal 1px dividers
- Each row: icon (16px, `--ink-60`) + label (sans 14, weight 500) + right-aligned value preview (sans 12, `--ink-60`) + chevron
- **Tap behavior:** chevron rotates 90°, section expands **in-place** (not a route change). Multiple sections can be open simultaneously. Re-tap collapses. Use `grid-template-rows: 0fr → 1fr` + 180ms ease.

Rows:
| Icon | Label | Right text |
|---|---|---|
| plus | Invite code | `zTU6Ib1T` |
| heart | Your profile style | `Amber · GE` |
| calendar | Calendar preferences | `Mon · 12h` |
| settings | Space info | `YLYL · Mar 25` |
| calendar | Google Calendar | `Connected` |
| heart | Membership | `Free` |

### 5.3 Rationale

Settings is a place people visit rarely. Density + quick-scan matters more than visual flourish here.

---

## 6. Empty state (Activity only)

Triggered when the shared space has zero activity items.

- **Illustration (small, abstract, reuses existing palette):** three stacked 110×90 rounded cards (radius 14) in `--rose-soft`, `--amber-soft`, `--card`, rotated -6°, +4°, -1°. Top (white) card has a 36px heart icon in `--rose`. No novel SVG drawing.
- **Eyebrow:** `NOTHING YET` — mono-ish feel via sans uppercase + 1.6 letter-spacing, `--rose`, 10px, weight 600
- **Headline:** sans, weight 600, 22px, `"Your story starts here."` (serif optional if serif-on-display is adopted)
- **Body:** sans, 14px, `--ink-60`, max 280px: *"Plan a date, save an idea, or upload a memory — we'll keep it all here for the two of you."*
- **Two pill CTAs:** primary (solid rose) `Plan a date` → `/calendar/new`; secondary (outline) `Save an idea` → `/ideas/new`

---

## 7. Interaction & motion

Applies to all redesigned screens. Keep it calm and quiet — this is a romance-journal product.

- **Row tap** → navigate to `target.href`. Entire row tappable.
- **Hover (desktop)** → background shifts to `--card-warm`, 120ms ease. No shadow, no scale, no border color change.
- **Filter chip change** → instant client-side re-filter, 120ms fade on enter/exit rows. Guard with `prefers-reduced-motion`.
- **Infinite scroll** (Activity, Memories) → fetch next 30 at 80% scroll. Footer line: sans 11px, `--ink-40`, `"Loading more…"`.
- **New item since last visit** (Activity only): first unseen row shows a 6px `--rose` dot in its meta line, left of the timestamp pill. Use IntersectionObserver to mark seen; persist `lastSeenActivityAt` via localStorage first, server-backed later.
- **Rail snap** (What's ahead) → CSS `scroll-snap-type: x mandatory`, no JS required.

---

## 8. Accessibility

- Activity rows: `<article>` with `aria-label="{partner} {eyebrow.lowercased()} {title}, {time}"`
- Day headers: `<h2>` (visually 14px but semantically correct)
- Timestamps: `<time datetime="{iso}">`
- Icons: `aria-hidden="true"` — semantic is in the eyebrow label
- Partner avatars: `<span role="img" aria-label="{partner name}">`
- Filter chips: `role="tablist"` + `aria-selected`
- Star/heart rating: `role="img" aria-label="Rated 5 out of 5"`
- Mobile hit targets: rows are ≥64px tall already; chips need `min-height: 36px` with `padding` providing the extra touch area
- Focus ring: `outline: 2px solid var(--rose); outline-offset: 2px`
- All text contrast: `--ink-80` on `--card` passes AA; `--ink-60` is for ≥12px secondary labels only — don't use for body prose

---

## 9. Implementation order

Ship P0 first, evaluate, then P1, then P2. Each is independently mergeable.

### P0 — Activity page (1–2 days)

1. Add any missing tokens from §1.1 to the token source
2. Normalize the activity feed into `ActivityItem[]` — write `toActivityItem(rawEvent)` once, fold heterogeneous sources into it
3. Emit `idea_saved`, `memory_completed`, `photo_added` events from the backend if not already
4. Build `<ActivityRow>` with all 7 types. Verify with fixture data (both partners, all types)
5. Build `<DayHeader>` with relative-date labeler
6. Replace Activity page header with eyebrow + H1 + filter chip rail + search
7. Add `<EmptyState>` behind feature detection
8. Add `lastSeenActivityAt` + new-item dot
9. Reduced-motion pass; a11y pass

### P1 — Memories mobile + What's ahead (1 day total)

10. `<MemoryCardMobile>` — inline-left thumb variant. Wire behind mobile breakpoint
11. Ideas horizontal rail — `<IdeaRail>` + `<IdeaCard>` (240px, snap-scroll)
12. Upcoming plans as colored-border rows (can share row primitive with Activity)

### P2 — Settings mobile (0.5 day)

13. Partners 2-col
14. Grouped list rows for secondary settings

---

## 10. Copy reference

Verbatim unless overridden.

| Slot | Copy |
|---|---|
| Activity eyebrow (m) | `ACTIVITY` |
| Activity H1 | `What you've been up to` |
| Activity desktop body | `Every plan, idea, and memory across your space.` |
| Activity filter chips | `All`, `Plans`, `Ideas`, `Memories`, `Photos`, `Notes` |
| Memories eyebrow | `MEMORIES · {count}` |
| Memories H1 | `Revisit your highlights` |
| Ideas section title | `Ideas` |
| Ideas section sub | `{count} on the shortlist` |
| Plans section title | `Upcoming plans` |
| Plans section sub | `{count} planned · next in {N} days` |
| Loading more | `Loading more…` |
| Activity empty eyebrow | `NOTHING YET` |
| Activity empty H1 | `Your story starts here.` |
| Activity empty body | `Plan a date, save an idea, or upload a memory — we'll keep it all here for the two of you.` |
| Activity empty CTAs | `Plan a date` (primary), `Save an idea` (secondary) |

Eyebrow labels per activity type: see §2.4.

---

## 11. Resolved decisions

1. **Serif adoption — YES, together with this change.** Fraunces on Memories H1 (`Revisit your highlights`) + Activity H1 (`What you've been up to`) + Activity empty-state headline (`Your story starts here.`) + the italic memory-note pull-quote inside Activity rows. All other text stays sans. Load Fraunces weights 400, 500, 600 only.
2. **Comments — read-only.** `comment_added` rows in Activity show the comment body inline but tapping navigates to the parent event; no inline edit affordance. (Revisit later if users ask.)
3. **Memory photos — hybrid.** `memory.heroPhotoUrl` comes from the Google Places photo API when the event has a place attached. If no place photo AND no user-uploaded photo, collapse the preview to note-only: drop the 56×56 thumb entirely and let the rating + italic note fill the card width. Footer line (`"{n} photos"`) hides when `photoCount === 0`.
4. **Idea → event promotion — link the pair.** When `idea_promoted` fires, render the row with BOTH eyebrow badges stacked: `NEW IDEA → PLANNED`, and render the body as a subtle linked strip: `{ideaTitle} → {eventTitle, eventDate}`. Visually, draw a thin 1px connector line from the left border of the originating idea row down to this promoted row when both are on-screen in the same day group; if the idea is on a prior day, skip the connector and rely on the inline `{ideaTitle} →` reference. Target href goes to the new event.
5. **Partner filter — confirmed out of v1.** Partner identity already carried by the left-border color + meta row; a filter adds UI weight without demand. Defer.
6. **Settings sub-pages — in-page expandable.** Chevron toggles an inline expand, not a route change. Use existing disclosure pattern (same animation curve as Memories filters). Only one section expanded at a time is fine but not required.

---

## 12. What we are NOT doing

To keep scope tight and respect the existing design language:

- Not replacing the palette
- Not changing the primary font
- Not introducing a central vertical timeline spine
- Not adding per-partner filtering
- Not adding a notification/bell surface
- Not touching Event Detail, Calendar grid (desktop), or the top app bar
- Not adding threaded comments on Activity

If any of these become wanted later, they can layer on top.

---

*Mockup reference: `Duet Mobile Wins.html` — pan/zoom through Activity (m+d), Memories (m), What's Ahead (m), Settings (m) with before/after artboards.*
