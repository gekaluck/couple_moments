# Technical Plan: UX Polish & Standardize Sprint

**Created:** 2026-02-04
**Status:** Ready for implementation
**Milestone:** M3 in rollout_plan.md

---

## Codebase Facts (Read Before Implementing)

These facts override any assumptions in the task descriptions below.

- **Tailwind v4** — no `tailwind.config.ts`. All theme tokens live in `src/app/globals.css` via `@theme inline` (line ~137). Extend tokens there, not in a JS config.
- **130+ CSS custom properties** already defined: shadows (`--shadow-sm` through `--shadow-xl`), text colors (`--text-primary/secondary/tertiary/muted`), backgrounds (`--bg-primary/secondary/card`, `--panel-bg`), borders (`--border-light/medium`), spacing (`--space-xs` through `--space-2xl`), and semantic colors for events/ideas/notes/partners.
- **Existing components in `src/components/ui/`**: `Card.tsx` (with `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`, `CardActions` subcomponents), `IconButton.tsx` (variants: ghost/danger/primary/secondary; sizes: sm/md/lg), `TagBadge.tsx` (auto-categorizes by tag name), `FormField.tsx` (with `Input`, `Textarea`, `Select`), `Skeleton.tsx` (with `SkeletonCard`, `SkeletonEventCard`, `SkeletonIdeaCard`, `SkeletonNoteCard`), `EmptyState.tsx` (variants: calendar/memories/ideas/notes/activity/generic), `SectionHeader.tsx`.
- **No standalone `Button.tsx`** — buttons are inline `<button>` elements with repeated class strings.
- **`IdeaCard.tsx` and `PlanCard.tsx`** do NOT use the `Card.tsx` component. They use hardcoded border/bg classes.
- **Two modal systems**: custom `Modal.tsx` (React portal, z-60) and `@headlessui/react` Dialog (used in `CreateIdeaModal.tsx`, `ConfirmDialog.tsx`). Headless UI v2.2.9 is installed.
- **No `Calendar.tsx` grid component or `DayCell.tsx`** — the calendar grid is inline in `src/app/spaces/[spaceId]/calendar/page.tsx` (lines 698-829).
- **Planning page** at `src/app/spaces/[spaceId]/planning/page.tsx` is a redirect to `/calendar`. The planning section renders inside the calendar page via `PlanningSection.tsx`, with `IdeasColumn` and `UpcomingPlansColumn` in a `grid-cols-1 lg:grid-cols-2` layout.
- **Glassmorphism theme** — `.surface` class uses `backdrop-filter: blur(18px)` and `rgba(255,255,255,0.82)` backgrounds.
- **CSS-only animations** — 15+ `@keyframes` defined in globals.css. No framer-motion.

---

## Phase 1: Design Token Additions

**Goal:** Add the specific tokens that are missing. Do NOT redefine existing shadows/colors.

### Task 1.1: Add premium shadow and surface tokens to globals.css

**File:** `src/app/globals.css`

**Action:** Add new tokens inside the existing `:root` block. These supplement (not replace) existing `--shadow-*` vars.

**What to add:**
```css
/* Premium shadows — softer than existing --shadow-md/lg */
--shadow-soft: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
--shadow-deep: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Semantic surface scale — aliases for card/panel backgrounds */
--surface-50: #fafafa;
--surface-100: #ffffff;
--surface-200: #f5f5f5;
--surface-400: #9ca3af;
--surface-900: #111827;
```

**What NOT to do:**
- Do not modify existing `--shadow-sm` through `--shadow-xl`.
- Do not rename `--bg-primary`, `--bg-card`, etc.

**Acceptance criteria:**
- New vars are usable via `shadow-[var(--shadow-soft)]` and `bg-[var(--surface-50)]` in Tailwind classes.
- Existing components render identically.

---

## Phase 2: Button Component

**Goal:** Create a `Button.tsx` to replace repeated inline button class strings. This is the highest-impact standardization task — there are 6+ distinct button patterns across the codebase.

### Task 2.1: Create `src/components/ui/Button.tsx`

**Action:** Build a polymorphic button component that covers the existing patterns.

**Existing patterns to unify (found in codebase):**

| Pattern | Example location | Classes |
|---------|-----------------|---------|
| Primary gradient | IdeaCard schedule modal submit | `bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[var(--shadow-md)]` |
| Secondary outline | IdeaCard action buttons | `border border-amber-200 bg-white text-amber-700` |
| Ghost text | Modal cancel buttons | `border border-[var(--panel-border)] text-[var(--text-muted)]` |
| Danger | IdeaCard delete button | `border border-red-200 bg-red-50 text-red-600` |
| Pill nav | Calendar prev/next/today | `.pill-button` CSS class |

**Props:**
```typescript
type ButtonProps = {
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading?: boolean;      // shows Loader2 spinner, disables click
  fullWidth?: boolean;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

**Implementation notes:**
- Import `Loader2` from `lucide-react` for loading state (already used in IdeaCard).
- Use `rounded-xl` (not `rounded-full`) for action buttons. Icon-only buttons should keep using `IconButton.tsx`.
- All variants should include `transition` and `disabled:opacity-50`.
- The `primary` variant uses the gradient: `bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]`.
- The `ghost` variant: `border border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]`.
- The `danger` variant: `border border-red-200 bg-red-50 text-red-600 hover:bg-red-100`.
- The `secondary` variant: `border border-[var(--border-light)] bg-white text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)]`.

**Acceptance criteria:**
- Renders correctly for all 4 variants and 3 sizes.
- `loading={true}` shows spinner icon and disables the button.
- Does NOT break existing pages (no existing code references it yet).

### Task 2.2: Migrate IdeaCard modal buttons to `Button`

**File:** `src/components/planning/IdeaCard.tsx`

**Action:** Replace inline `<button className="...">` in the schedule modal and edit modal with `<Button variant="primary">` and `<Button variant="ghost">`. This is the pilot migration — do NOT mass-replace buttons across the app in one pass.

**Specific replacements:**
1. Schedule modal "Create event" → `<Button variant="primary" loading={isPending}>Create event</Button>`
2. Schedule modal "Cancel" → `<Button variant="ghost" onClick={...}>Cancel</Button>`
3. Edit modal "Save changes" → `<Button variant="primary" loading={isPending}>Save changes</Button>`
4. Edit modal "Cancel" → `<Button variant="ghost" onClick={...}>Cancel</Button>`

**What NOT to do:**
- Do not replace the icon-only action buttons (Schedule, Edit, Comments, Delete) in the card header — those should remain as `IconButton` or stay as-is. They have distinct per-action coloring.

**Acceptance criteria:**
- Modal buttons render identically to current appearance.
- Loading states work correctly.

---

## Phase 3: Card Standardization

**Goal:** Make `IdeaCard` and `PlanCard` use the existing `Card.tsx` component instead of ad-hoc div styling.

### Task 3.1: Migrate PlanCard to use Card component

**File:** `src/components/planning/PlanCard.tsx`

**Current:** `<Link className="card-hover animate-fade-in-up group rounded-2xl border border-rose-200 bg-rose-50 p-5 ...">`

**Problem:** `Card.tsx` renders a `<div>`, but `PlanCard` needs to be a `<Link>`. Two options:

**Option A (recommended):** Wrap `Card` inside a `Link`. Pass `padding="md"` and `variant="rose"` to `Card`:
```tsx
<Link href={`/events/${id}`} className="block">
  <Card variant="rose" hover padding="md" className="animate-fade-in-up">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {/* comment count badge */}
    </CardHeader>
    <CardDescription>{description}</CardDescription>
    <CardFooter>{/* date, creator, place */}</CardFooter>
  </Card>
</Link>
```

**Option B:** Make `Card` accept an `as` prop for polymorphism. More complex, defer unless needed elsewhere.

**Acceptance criteria:**
- PlanCard renders visually identical.
- Hover lift effect works (Card `hover` prop).
- Link navigation works.

### Task 3.2: Migrate IdeaCard body to use Card subcomponents

**File:** `src/components/planning/IdeaCard.tsx`

**Current:** Lines 113-166 are a hand-built card with `<h3>`, `<p>`, tag list, and metadata. These map directly to existing `CardTitle`, `CardDescription`, and `CardFooter`.

**Action:** Wrap the outer div with `Card variant="amber" padding="md"` and use subcomponents for the header/title/footer sections. Keep the action buttons, comments section, and modals unchanged.

**Specific mapping:**
- Outer `<div className="...rounded-2xl border border-amber-200 bg-amber-50 p-5...">` → `<Card variant="amber" padding="md" className="card-hover animate-fade-in-up">`
- `<h3>` title → `<CardTitle>`
- Description `<p>` → `<CardDescription>`
- Metadata line (created by / time ago) → `<CardFooter>`

**What NOT to change:**
- Action buttons row (Schedule, Edit, Comments, Delete)
- Inline comments section
- Modals (Schedule, Edit, Delete)

**Acceptance criteria:**
- IdeaCard renders visually identical.
- Card variant colors match (`amber`).

---

## Phase 4: Calendar Day Cell Extraction

**Goal:** Extract the inline calendar grid cell (currently ~120 lines of JSX inside `calendar/page.tsx`) into a `DayCell` component for readability and to add out-of-month dimming.

### Task 4.1: Extract DayCell component

**Create:** `src/app/spaces/[spaceId]/calendar/day-cell.tsx`

**Action:** Move the `monthDays.map()` callback (lines 699-828 of `calendar/page.tsx`) into a standalone `DayCell` component.

**Props:**
```typescript
type DayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  isCompact: boolean;
  events: EventSummary[];
  blocks: BlockSummary[];
  nowLabel: string;
  addEventHref: string;
  creatorPalette: Map<string, CreatorColors>;
  calendarTimeFormat: "12h" | "24h";
  buildBlockEditHref: (blockId: string) => string;
};
```

**Styling changes for out-of-month days:**
- Current: `day.isCurrentMonth ? ... : "bg-white/40 text-[var(--text-muted)]"`
- New: `day.isCurrentMonth ? ... : "bg-[var(--surface-50)] text-[var(--surface-400)] opacity-50"`
  (Uses the new tokens from Task 1.1)

**Acceptance criteria:**
- Calendar renders identically to current state.
- Out-of-month days are visually dimmer.
- The `calendar/page.tsx` file shrinks by ~120 lines.

### Task 4.2: Adjust planning grid to asymmetric columns

**File:** `src/app/spaces/[spaceId]/calendar/page.tsx`

**Current (line 843):** `<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">`

**Change to:** `<div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_0.6fr]">`

This gives ideas (left) more room and makes upcoming plans (right) a compact sidebar.

**Acceptance criteria:**
- On large screens, ideas column is ~62% width, upcoming plans is ~38%.
- Gap between columns increases from `gap-8` (2rem) to `gap-12` (3rem).
- Mobile layout unchanged (single column).

---

## Phase 5: Modal Consolidation (Optional / Low Priority)

**Goal:** Standardize on one modal system. Currently there are two: custom `Modal.tsx` and Headless UI `Dialog`.

### Task 5.1: Migrate custom Modal.tsx to Headless UI Dialog

**File:** `src/components/Modal.tsx`

**Current:** Portal-based, manual Escape handling, manual scroll lock, `z-60`.

**Headless UI benefits:** Built-in focus trap, Escape handling, scroll lock, aria attributes, transitions.

**Action:** Rewrite `Modal.tsx` internals to use `Dialog` and `Transition` from `@headlessui/react` while keeping the same external props (`isOpen`, `onClose`, `title`, `children`). This way all existing callers (IdeaCard schedule/edit modals, etc.) continue to work without changes.

**Styling to preserve:**
- Backdrop: `bg-black/30` → change to `backdrop-blur-sm bg-[var(--surface-900)]/30`
- Panel: keep `rounded-3xl border bg-white p-6 md:p-8`
- Max width: `max-w-md` (already used in most cases)
- Animation: use `Transition` enter/leave instead of CSS `@keyframes modalIn`

**Risk:** Medium — modals are used in IdeaCard, AvailabilityBlockModal, and event edit flows. Test all modal open/close/submit paths.

**Acceptance criteria:**
- All modals open, close, and submit correctly.
- Focus is trapped inside modal.
- Backdrop blur effect applied.
- No visual regression.

---

## Execution Order

| Step | Task | Dependencies | Risk |
|------|------|-------------|------|
| 1 | 1.1 — Add CSS tokens | None | Low |
| 2 | 2.1 — Create Button.tsx | None | Low |
| 3 | 2.2 — Migrate IdeaCard modal buttons | 2.1 | Low |
| 4 | 3.1 — Migrate PlanCard to Card | None | Low |
| 5 | 3.2 — Migrate IdeaCard to Card | None | Low |
| 6 | 4.1 — Extract DayCell | 1.1 (for surface tokens) | Medium |
| 7 | 4.2 — Asymmetric planning grid | None | Low |
| 8 | 5.1 — Modal consolidation | None | Medium |

Steps 1, 2.1, 3.1, 3.2, 4.2 can be parallelized. Steps 2.2 depends on 2.1. Step 4.1 depends on 1.1. Step 5.1 is optional.

---

## Out of Scope

These were in the original plan but don't match the codebase or are premature:

- **Badge.tsx**: `TagBadge.tsx` already exists and auto-categorizes tags. The proposed "romantic/cozy/date/weekend" variants overlap with existing categories. No action needed.
- **`SchedulingModal.tsx`**: No such file exists. Scheduling is inline in IdeaCard. Extracting it into its own component could be a follow-up but is not a polish task.
- **`tailwind.config.ts`**: Does not exist and is not needed with Tailwind v4's CSS-based theming.
- **`Calendar.tsx` standalone component**: The calendar is page-specific with heavy server-action wiring. Extracting the full grid into a reusable component adds complexity without clear reuse.

---

## Verification

After each task:
1. `npm run build` must pass.
2. Visual spot-check: calendar page, planning section, idea cards, event detail page.
3. Modal flows: create event, schedule idea, edit idea, delete idea — all must open/close/submit correctly.
