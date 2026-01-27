# Couple Moments - Project Context Document

**Last Updated:** January 27, 2026
**Project Name:** Couple Moments (codename: `date_mvp`)

---

## 1. Project Vision & Goals

### What problem does this solve?
Couple Moments helps couples strengthen their relationship by making it easy to:
- **Plan dates together** on a shared calendar
- **Capture and revisit memories** with photos and notes
- **Maintain an idea inbox** for future date inspiration
- **Communicate** through reactions and comments
- **Stay on track** with email reminders for planned events

### Target Users
- Couples in committed relationships (married, dating, long-distance)
- 2 people per "Couple Space" (though architecture supports multi-tenancy)
- Users who want a dedicated, private space for relationship planning (not a social network)

### Vision Evolution
**Original Vision:**
- Simple calendar + memory capture app
- Basic CRUD for events and ideas
- Email reminders

**Current State:**
- Evolved into a comprehensive planning hub with **Calendar as the central page**
- Added **Planning section** (ideas + upcoming plans) embedded in Calendar view
- Added **Availability Blocks** to mark when partners are unavailable
- Added **Place/location integration** (Google Places API) for events and ideas
- Added **Notes system** that unifies comments (event/idea comments + standalone notes)
- Added **Activity feed** to track all changes across the space
- Added **Memories timeline** for browsing past events by year/tags
- Enhanced reactions to work on both Events and Notes

---

## 2. Requirements

### Core Features (Implemented ✅)
- ✅ **Authentication:** Email/password login and registration
- ✅ **Couple Spaces:** Multi-tenant architecture, each couple has their own space
- ✅ **Invite System:** Generate invite codes for partner to join
- ✅ **Calendar View:** Month grid showing events and availability blocks
- ✅ **Events:** Create, edit, delete events (type: PLANNED or MEMORY)
- ✅ **Ideas Inbox:** Create ideas, schedule them as events, mark done, delete
- ✅ **Planning Hub:** Embedded in Calendar page (add ideas, view upcoming plans, schedule ideas)
- ✅ **Availability Blocks:** Mark periods when unavailable (with color-coded creator badges)
- ✅ **Places Integration:** Attach Google Places details to events and ideas (name, address, coordinates, photos, hours, website)
- ✅ **Notes System:** Unified comments (manual notes, event comments, idea comments)
- ✅ **Reactions:** Emoji reactions on Events and Notes
- ✅ **Activity Feed:** Change log showing all creates/updates/deletes
- ✅ **Memories Page:** Browse past events filtered by year and tags
- ✅ **Tags:** Tag events and ideas, filter by tags
- ✅ **Time Toggle:** Events can have "all-day" mode (timeIsSet flag)

### Nice-to-Have Features (Discussed)
- 📋 Drag-and-drop event rescheduling on calendar
- 📋 Week view for calendar
- 📋 Budget tracking per event
- 📋 Photo gallery enhancements (carousel, grid view)
- 📋 Dark mode
- 📋 Mobile app (PWA or native)
- 📋 Weather integration
- 📋 @mentions in comments
- 📋 Push notifications
- 📋 Export memories as PDF/social posts
- 📋 Recurring events
- 📋 Smart suggestions based on past dates
- 📋 "Random idea picker" for spontaneous planning

### Features Explicitly NOT Included
- ❌ **Photo storage:** Not yet implemented (placeholder in schema, but no upload route)
- ❌ **Email notifications:** Schema exists but no background job/cron implemented
- ❌ **Social features:** No public sharing, no friends, no discovery
- ❌ **Multiple couple spaces per user:** Architecture supports it, but UI assumes 1 space per user
- ❌ **Advanced permissions:** Everyone in a space is a "member" (no admin/guest roles)
- ❌ **Real-time sync:** No WebSockets or live updates

---

## 3. Architecture Decisions

### Tech Stack
```
Frontend:    Next.js 15+ (App Router, Server Components, Server Actions)
Language:    TypeScript
Styling:     Tailwind CSS v4
Database:    SQLite (via better-sqlite3)
ORM:         Prisma v7 with custom client output path
Auth:        Custom credential-based (bcrypt password hashing, session cookies)
UI Library:  @headlessui/react for modals/dropdowns
Icons:       lucide-react
Maps:        Google Maps JavaScript API (@googlemaps/js-api-loader)
```

### Why This Stack?

#### Next.js App Router
- **Server Components** reduce client-side JS and improve performance
- **Server Actions** simplify form handling without separate API routes
- **File-based routing** makes structure clear and maintainable
- **Built-in optimization** for fonts, images, and CSS

#### SQLite + Prisma
- **SQLite:** Chosen for MVP simplicity (single-file database, no server setup required)
- **Prisma:** Type-safe ORM with excellent TypeScript integration
- **Custom output path:** `src/generated/prisma/` to keep generated code separate from source

**Trade-off:** SQLite limits concurrent writes (not ideal for high-traffic production), but perfect for MVP with 2-person spaces. Future migration path exists to PostgreSQL if needed.

#### Tailwind CSS v4
- **Utility-first:** Rapid UI development
- **Custom CSS variables:** Defined in `globals.css` for theme consistency
- **Design system:** Established patterns (`.surface`, `.pill-button`, etc.)

#### Custom Auth (not NextAuth)
- **Simplicity:** Avoided OAuth complexity for MVP
- **Control:** Full control over session management and user flow
- **Session cookies:** HTTP-only cookies stored in-memory (could migrate to Redis/database)

**Trade-off:** Manual implementation means more code to maintain, but gives exact behavior needed.

### Key Design Decisions

#### 1. Calendar as Hub
**Decision:** Make Calendar the default landing page and embed Planning section within it.

**Rationale:**
- Users think in terms of "what's planned" first
- Reduces navigation friction (ideas + calendar in one view)
- Mirrors how couples actually plan ("Let's look at the calendar and pick a day")

**Implementation:** `/spaces/[spaceId]/ideas` redirects to `/spaces/[spaceId]/calendar`

#### 2. Unified Notes System
**Decision:** Replace separate `Comment` model with `Note` model that handles:
- Manual notes (kind: MANUAL)
- Event comments (kind: EVENT_COMMENT, parentType: EVENT, parentId: eventId)
- Idea comments (kind: IDEA_COMMENT, parentType: IDEA, parentId: ideaId)

**Rationale:**
- Reduces duplication (same UI patterns for all comment types)
- Enables central "Notes Center" page to show all notes
- Simplifies reactions (reactions point to notes, not separate comment entities)

**Migration:** `20260103020000_unify_notes_reactions` migration

#### 3. Availability Blocks (Not Calendar Events)
**Decision:** Separate `AvailabilityBlock` model instead of using Event type "UNAVAILABLE"

**Rationale:**
- Events represent "things we do together"
- Availability blocks represent "when I'm busy"
- Different UX needs (blocks need creator attribution, events don't)
- Clearer data model separation

**Implementation:** Color-coded by creator, displayed differently on calendar

#### 4. Places Integration
**Decision:** Denormalize Google Places data into Event and Idea tables

**Rationale:**
- Avoids API calls to fetch place details repeatedly
- Place data can change/disappear from Google (save snapshot)
- Improves performance (no external API calls on page load)

**Fields:**
```
placeId, placeName, placeAddress, placeLat, placeLng, 
placeUrl, placeWebsite, placeOpeningHours (JSONB), 
placePhotoUrls (JSONB)
```

#### 5. Tags as JSON String (not array)
**Decision:** SQLite stores tags as `TEXT` with `'[]'` default, parsed as JSON in app code

**Rationale:**
- SQLite doesn't natively support string arrays
- Prisma schema uses `String[]` but SQLite adapter serializes to JSON
- Helper functions `parseTags()` and `normalizeTags()` handle conversion

**Implementation:** `lib/tags.ts`

#### 6. Server Actions Over API Routes
**Decision:** Prefer Server Actions for mutations, API routes only where needed

**Rationale:**
- Server Actions reduce boilerplate (no fetch calls, no API route files)
- Better type safety (direct function calls)
- Simpler error handling

**Where API routes remain:**
- Auth endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`)
- Some couple-space operations (`/api/couple-spaces`)

### No "Server v1" vs "Server v2"
**Note:** This project has only one server (Next.js App Router). There is no legacy server version or migration scenario.

---

## 4. Current State

### Fully Implemented ✅

#### Pages
- `/` - Redirects to first couple space or onboarding
- `/login` - Login form
- `/register` - Registration form
- `/spaces/[spaceId]/calendar` - **Primary hub:** Calendar grid + Planning section
- `/spaces/[spaceId]/memories` - Past events timeline with filters
- `/spaces/[spaceId]/notes` - Notes center with search and filters
- `/spaces/[spaceId]/activity` - Activity feed (change log)
- `/spaces/onboarding` - Create or join couple space
- `/events/[eventId]` - Event detail with reactions and comments

#### Components
- `space-nav.tsx` - Top navigation bar with heart icon, space name, nav links, logout
- `CalendarAddControls` - Modal for creating events and availability blocks
- `AvailabilityBlockModal` - Edit availability blocks
- `PlanningIdeaList` - List of ideas with schedule/done/delete actions
- `EventComments` - Comment list for event detail page
- `DropdownMenu` - Headless UI dropdown wrapper

#### Library Functions
- `lib/auth.ts` - Password hashing, user creation
- `lib/session.ts` - Session cookie management
- `lib/current-user.ts` - Get current user from session
- `lib/couple-spaces.ts` - CRUD for couple spaces and memberships
- `lib/events.ts` - CRUD for events, including place details
- `lib/ideas.ts` - CRUD for ideas
- `lib/notes.ts` - CRUD for notes (comments)
- `lib/availability.ts` - CRUD for availability blocks
- `lib/reactions.ts` - Toggle reactions on events/notes
- `lib/activity.ts` - Query change log entries
- `lib/calendar.ts` - Month grid generation, date formatting
- `lib/creator-colors.ts` - Generate color palette for creators (for availability blocks)
- `lib/tags.ts` - Parse and normalize tags
- `lib/prisma.ts` - Prisma client singleton

#### Database
- Prisma schema with 11 models (see schema.prisma)
- 7 migrations applied (init, notes, event_idea_comments, unify_notes_reactions, add_places, add_place_details, add_event_time_flag)
- SQLite database at `prisma/dev.db`

#### Styling
- Custom CSS variables in `globals.css`
- Design tokens: rose/pink gradient theme, glassmorphic surfaces
- Reusable classes: `.surface`, `.pill-button`, etc.
- Font families: Inter (sans), Playfair Display (display)

### Partially Done 🚧

#### Photo Upload
- **Schema exists:** `Photo` model with `eventId`, `uploadedByUserId`, `storageUrl`
- **Not implemented:** No API route, no file upload logic, no storage integration
- **UI placeholder:** Event detail page could show photos but none exist

#### Email Notifications
- **Schema exists:** `Notification` model with `type`, `scheduledAt`, `sentAt`
- **Not implemented:** No background job to send emails, no email service integration
- **Code exists:** Functions to create notifications when events are created, but never sent

#### Mobile Responsiveness
- **Mostly responsive:** Tailwind breakpoints used throughout
- **Needs work:** Calendar cells are cramped on mobile, modals could be improved
- **No mobile-specific features:** No swipe gestures, no bottom nav

### Planned But Not Started 📋
- Drag-and-drop calendar rescheduling
- Week view for calendar
- Budget tracking
- Weather integration
- Recurring events
- Photo gallery with carousel
- Dark mode
- PWA features (offline, install prompt)

### Known Bugs & Technical Debt

#### 1. **Session storage is in-memory**
- Sessions stored in a `Map()` in `lib/session.ts`
- **Problem:** Sessions lost on server restart
- **Fix:** Migrate to Redis or database-backed sessions

#### 2. **No pagination on Notes page**
- Notes page has "Next/Previous" buttons but they're client-side pagination
- **Problem:** Will be slow with thousands of notes
- **Fix:** Implement cursor-based pagination in query

#### 3. **TODO in activity.ts**
```typescript
// TODO: include deletions or other activity not represented by current notes.
```
- Activity feed doesn't show deleted notes
- **Problem:** Incomplete audit trail
- **Fix:** Query ChangeLogEntry with DELETE type

#### 4. **Calendar quick-add intercepts event card clicks**
- Each day cell has a `<Link>` wrapper to open "new event" modal
- **Problem:** Clicking events in cell also triggers quick-add
- **Workaround:** Event cards have `z-10` to overlay, but still finicky
- **Fix:** Better event delegation or click handling

#### 5. **SQLite doesn't support concurrent writes well**
- **Problem:** May cause issues if both partners edit simultaneously
- **Fix:** Migrate to PostgreSQL for production

#### 6. **No error boundaries**
- **Problem:** Errors crash the whole page
- **Fix:** Add React error boundaries and friendly error UI

#### 7. **No loading states**
- **Problem:** Forms submit instantly but no feedback until redirect
- **Fix:** Add optimistic UI updates or loading spinners

---

## 5. Data Model

### Key Entities

```
User
├── Membership (→ CoupleSpace)
├── Event (created by)
├── Idea (created by)
├── AvailabilityBlock (created by)
├── Note (authored by)
├── Reaction (created by)
├── ChangeLogEntry (created by)
└── Notification (recipient)

CoupleSpace
├── Membership (→ User)
├── Event
├── Idea
├── AvailabilityBlock
└── Note

Event (type: PLANNED or MEMORY)
├── Photo
├── Reaction
├── Note (comments)
├── ChangeLogEntry
├── Notification
└── originIdeaId (→ Idea, if converted from idea)

Idea (status: NEW, PLANNED, DONE)
├── Note (comments)
├── ChangeLogEntry
└── convertedToEventId (→ Event, if converted to event)

Note (kind: MANUAL, EVENT_COMMENT, IDEA_COMMENT)
├── Reaction
├── replyToNoteId (→ Note, for threading)
└── parentType + parentId (for linking to Event or Idea)
```

### Relationships & Business Rules

#### 1. **Event ↔ Idea Conversion**
- When idea is scheduled as event:
  - `Idea.convertedToEventId` → points to new Event
  - `Event.originIdeaId` → points back to Idea
  - `Idea.status` → set to `PLANNED`
- **Constraint:** One-to-one relationship (unique constraints on both sides)

#### 2. **Availability Blocks**
- Must have `startAt` and `endAt` (date ranges)
- Displayed with creator's color palette (generated from userId)
- Show creator initials badge on calendar

#### 3. **Notes (Unified Comments)**
- `kind` determines behavior:
  - `MANUAL`: Standalone note
  - `EVENT_COMMENT`: Linked to event (parentType=EVENT, parentId=eventId)
  - `IDEA_COMMENT`: Linked to idea (parentType=IDEA, parentId=ideaId)
- `replyToNoteId` enables threading (not currently used in UI)

#### 4. **Reactions**
- `targetType` can be `EVENT` or `NOTE`
- `targetId` is the ID of the event or note
- Users can react multiple times with different emojis
- **No unique constraint:** Same user can add same emoji multiple times (maybe bug?)

#### 5. **Tags**
- Stored as JSON string: `'["tag1","tag2"]'`
- Parsed with `parseTags()` helper
- Used for filtering events and ideas

#### 6. **Event Types**
- `PLANNED`: Future dates, show on calendar and upcoming plans
- `MEMORY`: Past dates, show on memories timeline

#### 7. **Time vs All-Day Events**
- `timeIsSet` boolean flag (default: true)
- When false, event is "all-day" (no specific time shown)

### Validation Rules

#### User
- Email must be unique
- Password hashed with bcrypt (10 rounds)
- Name is optional

#### CoupleSpace
- `inviteCode` must be unique (generated with `cuid()`)
- MVP assumes exactly 2 members per space (not enforced in schema)

#### Event
- `dateTimeStart` required
- `dateTimeEnd` optional (defaults to null)
- `type` must be `PLANNED` or `MEMORY`
- Tags default to empty array `[]`

#### Idea
- `status` defaults to `NEW`
- Can only have one `convertedToEventId` (unique constraint)

#### Availability Block
- `startAt` must be before `endAt` (not validated in schema, should be app-level)

---

## 6. Development Context

### Established Patterns & Conventions

#### 1. **File Organization**
```
src/
├── app/                    # Next.js pages (App Router)
│   ├── api/               # API routes
│   ├── events/            # Event detail pages
│   ├── spaces/            # Space pages
│   │   └── [spaceId]/     # Dynamic space routes
│   ├── login/             # Auth pages
│   ├── register/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home redirect
├── components/            # Reusable components
├── lib/                   # Server-side utilities
└── generated/prisma/      # Generated Prisma client
```

#### 2. **Server Action Pattern**
```typescript
async function handleCreate(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  const title = formData.get("title")?.toString().trim() ?? "";
  
  // Validation
  if (!title) {
    redirect(`/spaces/${spaceId}/page`);
  }
  
  // Business logic
  await createSomething(userId, { title });
  
  // Redirect back
  redirect(`/spaces/${spaceId}/page`);
}
```

#### 3. **Auth Enforcement**
- Every page calls `await requireUserId()` at top
- Redirects to `/login` if no session
- No public pages (except login/register)

#### 4. **CSS Variable Theming**
```css
:root {
  --accent-primary: #e63946;
  --bg-primary: #fafafa;
  --text-primary: #1a1a1a;
  /* ... */
}
```
- Variables used throughout components
- Enables easy theme switching (future dark mode)

#### 5. **Component Naming**
- Page components: `Page` suffix (e.g., `CalendarPage`)
- Client components: Explicit `"use client"` directive
- Server components: Default (no directive)

#### 6. **Error Handling**
- Most errors trigger redirects (not ideal)
- No toast notifications or error UI
- **Future improvement:** Add error boundaries and user feedback

### Tricky Implementation Details

#### 1. **SQLite JSON Fields**
Prisma schema says `JSONB` but SQLite only supports `TEXT`:
```prisma
placeOpeningHours JSONB
```
Actually stored as JSON string in SQLite. Prisma adapter handles serialization.

#### 2. **Calendar Day Cells with Quick-Add**
Problem: Each day cell is wrapped in a `<Link>` for quick-add, but events inside also need to be clickable.

Solution:
```tsx
<div className="relative ...">
  <Link className="absolute inset-0 z-0" href="...?new=date" />
  <div className="relative z-10">
    <Link href="/events/123">Event</Link>
  </div>
</div>
```
Event links have higher z-index to appear "above" the day cell link.

#### 3. **Availability Block Color Generation**
Each user gets a deterministic color palette based on userId:
```typescript
const creatorPalette = buildCreatorPalette([
  { id: userId, name, email }
]);
const colors = creatorPalette.get(userId);
// { accent: '#457b9d', accentSoft: '#d7e5ed' }
```
Used to color-code blocks on calendar.

#### 4. **Tags Helper Functions**
Tags are stored as JSON strings but treated as arrays:
```typescript
// Parse from DB
parseTags('["outdoor","food"]') → ['outdoor', 'food']

// Normalize from form input
normalizeTags('outdoor, food, Food') → '["outdoor","food"]'
```

#### 5. **Modal State Management**
Modals opened via URL query params (not React state):
```
?new=2026-01-15        → Open new event modal with date prefilled
?editBlock=block_123   → Open edit availability modal for block
```

Allows deep-linking and browser back button to close modal.

### Performance Considerations

#### 1. **Server Components by Default**
- Most components are Server Components (no client JS sent)
- Only add `"use client"` when needed (forms, modals, interactivity)

#### 2. **Calendar Query Optimization**
- Query events only for visible month (startDate, endDate filter)
- Separate queries for:
  - Events (for calendar grid)
  - Upcoming events (for planning section)
  - Ideas (for planning section)

#### 3. **Creator Palette Caching**
- Built once per page load
- Reused for all availability blocks
- Avoids recalculating colors per block

#### 4. **Prisma Include/Select**
- Carefully select only needed fields
- Use `include` for relations only when displaying
- Example:
```typescript
// Good
const events = await prisma.event.findMany({
  where: { coupleSpaceId },
  select: { id: true, title: true, dateTimeStart: true }
});

// Avoid
const events = await prisma.event.findMany({
  where: { coupleSpaceId },
  include: { photos: true, reactions: true, notes: true }
});
```

---

## 7. Future Roadmap

### High Priority (Next Features)

#### 1. **Toast Notifications** 🔥
- Add success/error feedback for actions
- Library: `sonner` or `react-hot-toast`
- **Why:** Users have no feedback when actions succeed/fail

#### 2. **Loading States** 🔥
- Add loading spinners or skeleton screens
- Optimistic UI updates for forms
- **Why:** Current UX feels unresponsive

#### 3. **Photo Upload** 🔥
- Implement file upload to cloud storage (S3/Supabase)
- Create `/api/events/[eventId]/photos` endpoint
- Display photos in event detail and memories
- **Why:** Core feature missing

#### 4. **Error Boundaries & Better Error Handling** 🔥
- Add React error boundaries
- Replace redirects with toast notifications
- Validation error messages in forms
- **Why:** Current error UX is bad (redirect or crash)

### Medium Priority

#### 5. **Email Notifications**
- Background job (cron) to send reminders
- Integrate email service (Resend/SendGrid)
- User preferences to disable reminders

#### 6. **Mobile Improvements**
- Bottom navigation for mobile
- Swipe gestures for actions
- Better calendar cell spacing
- Modal improvements (full-screen on mobile)

#### 7. **Search & Filters**
- Global search across events/ideas/notes
- Advanced filters (date range, tags, creator)
- Search on calendar page

#### 8. **Confirmation Dialogs**
- Confirm before delete (events, ideas, notes)
- Library: Headless UI Dialog
- **Currently:** Deletes happen immediately (dangerous)

### Lower Priority (Nice-to-Have)

#### 9. **Week View**
- Alternative calendar view
- Better for detailed planning

#### 10. **Drag-and-Drop Rescheduling**
- Drag events between days
- Library: `dnd-kit` or `react-beautiful-dnd`

#### 11. **Dark Mode**
- Toggle in nav
- CSS variable overrides
- Persist preference in localStorage

#### 12. **Budget Tracking**
- Add budget field to events
- Show total spending per month/year

#### 13. **Recurring Events**
- Weekly/monthly/yearly patterns
- Complex schema changes needed

#### 14. **PWA Features**
- Service worker for offline
- Install prompt
- Push notifications (requires service)

### Feature Dependencies

```
Photo Upload
└── Cloud Storage Setup (S3/Supabase)

Email Notifications
├── Email Service Integration (Resend/SendGrid)
└── Background Job System (cron/worker)

Drag-and-Drop
└── Update Event API (handle date changes)

Recurring Events
├── Schema Changes (add recurrence rules)
├── UI for recurrence patterns
└── Query logic to expand recurring events

Budget Tracking
└── Schema Changes (add budget field)
```

### Things to Watch Out For

#### 1. **SQLite Limitations**
- When user base grows, migrate to PostgreSQL
- Watch for write contention issues

#### 2. **Session Storage**
- In-memory sessions don't scale
- Migrate to Redis or database sessions before production

#### 3. **Google Places API Costs**
- API calls can get expensive
- Cache place details aggressively
- Consider rate limiting

#### 4. **Photo Storage Costs**
- Cloud storage costs scale with uploads
- Set file size limits
- Consider image compression

#### 5. **Email Sending Limits**
- Free tiers have sending limits
- Monitor usage and upgrade as needed

#### 6. **Mobile Performance**
- Large calendar grids can be slow on mobile
- Test on actual devices, not just DevTools

#### 7. **Data Privacy**
- All couple data is private
- No admin access to couple spaces
- GDPR compliance may be needed (data export, deletion)

---

## Quick Start for New Developer

### 1. **Clone and Install**
```bash
npm install
```

### 2. **Setup Database**
```bash
npx prisma generate
npx prisma migrate dev
```

### 3. **Seed Demo Data** (Optional)
```bash
npx tsx scripts/seed-demo.ts <spaceId> --reset
```

### 4. **Run Dev Server**
```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. **Key Files to Read First**
1. `prisma/schema.prisma` - Data model
2. `src/app/spaces/[spaceId]/calendar/page.tsx` - Main page
3. `src/lib/events.ts` - Example CRUD library
4. `user_journey.md` - User flows

### 6. **Common Tasks**
- **Add a new page:** Create in `src/app/spaces/[spaceId]/newpage/page.tsx`
- **Add a component:** Create in `src/components/MyComponent.tsx`
- **Update schema:** Edit `schema.prisma`, run `npx prisma migrate dev`
- **Add server function:** Create in `src/lib/myfunction.ts`

---

## Final Notes

This document captures the project state as of **January 20, 2026**. The codebase is functional and has a solid foundation, but there are several areas for improvement (especially error handling, loading states, and photo upload).

The project is in **MVP/early beta** stage - core features work, but polish and edge-case handling need work.

**Architecture is sound** - the choice of Next.js App Router, Prisma, and SQLite makes this easy to develop and maintain for an MVP. When ready to scale, the migration path to PostgreSQL is clear.

**Design system is established** - CSS variables, Tailwind patterns, and component conventions are consistent. New features should follow the established patterns.

**User experience is the priority** - Every decision should optimize for couples planning and reminiscing together. Keep the UI simple, delightful, and focused on the relationship.

Good luck! 🚀
