# Implementation Plan - Couple Moments

## Overview
This plan covers 4 features + deployment infrastructure changes. Estimated total: 3-4 days of work.

---

## Phase 1: Deployment Infrastructure (Do First)

### 1.1 Switch from SQLite to PostgreSQL

**Files to modify:**
- `prisma/schema.prisma` - Change provider from "sqlite" to "postgresql"
- `src/lib/prisma.ts` - Remove better-sqlite3 adapter, use standard PrismaClient
- `package.json` - Remove `@prisma/adapter-better-sqlite3` and `better-sqlite3`

**Steps:**
1. Update schema.prisma datasource
2. Simplify prisma.ts to standard client
3. Remove SQLite dependencies
4. Add `"postinstall": "prisma generate"` to package.json scripts
5. Test locally with Docker PostgreSQL or Neon free tier

**Local testing:**
```bash
# Option A: Docker
docker run --name couple-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Option B: Neon.tech (free cloud PostgreSQL)
# Create project at neon.tech, copy connection string
```

---

### 1.2 Database-Backed Sessions

**New schema addition:**
```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Files to modify:**
- `prisma/schema.prisma` - Add Session model, add relation to User
- `src/lib/sessions.ts` - Rewrite to use Prisma instead of in-memory Map

**New session functions:**
```typescript
// Replace in-memory Map with:
createSession(userId: string): Promise<string>  // returns token
getSession(token: string): Promise<Session | null>
deleteSession(token: string): Promise<void>
cleanExpiredSessions(): Promise<void>  // for cron job later
```

**Cookie handling stays the same** - just the storage backend changes.

---

## Phase 2: Memory Rating (Feature 1)

### 2.1 Schema Change

**Add to Event model:**
```prisma
model Event {
  // ... existing fields
  rating      Int?      // 1-5, null = not rated
  ratedAt     DateTime?
}
```

### 2.2 UI Changes

**File: `src/app/events/[eventId]/page.tsx`**
- Add rating component (5 hearts) below event details
- Only show for past events (memories)
- Show current rating if exists, allow changing

**New component: `src/components/ui/HeartRating.tsx`**
```typescript
type HeartRatingProps = {
  value: number | null;      // 1-5 or null
  onChange: (rating: number) => void;
  readonly?: boolean;
};
```

**Visual design:**
- 5 heart icons in a row
- Filled hearts = current rating
- Hollow hearts = remaining
- Click to rate, click same to change
- Rose/pink color scheme

### 2.3 Server Action

**File: `src/app/events/[eventId]/page.tsx`**
```typescript
async function handleRate(formData: FormData) {
  "use server";
  const rating = Number(formData.get("rating"));
  await updateEventRating(eventId, userId, rating);
  revalidatePath(`/events/${eventId}`);
}
```

**File: `src/lib/events.ts`**
```typescript
export async function updateEventRating(
  eventId: string,
  userId: string,
  rating: number
): Promise<void>
```

### 2.4 Memories Page Enhancement

**File: `src/app/spaces/[spaceId]/memories/page.tsx`**
- Show rating (hearts) on memory cards
- Add filter: "Show top-rated" or sort by rating

---

## Phase 3: Quick Repeat (Feature 2)

### 3.1 UI Addition

**File: `src/app/events/[eventId]/page.tsx`**
- Add "Do this again" button for past events
- Button opens modal with pre-filled event form
- Pre-fill: title, description, place info, tags
- Leave date/time empty for user to pick

**Button placement:** Next to Edit/Delete buttons, only shown for past events

### 3.2 Implementation Approach

**Option A: URL-based (simpler)**
- Button links to `/spaces/{spaceId}/calendar?repeat={eventId}`
- Calendar page detects `repeat` param
- Fetches original event, opens create modal with pre-filled data

**Option B: Modal on event page (smoother UX)**
- Reuse `CreatePlanModal` component
- Pass pre-filled values as props
- Submit creates new event, redirects to it

**Recommendation:** Option A - less code, reuses existing modal

### 3.3 Changes Needed

**File: `src/app/spaces/[spaceId]/calendar/page.tsx`**
- Add `repeat` to searchParams type
- If `repeat` param exists, fetch that event
- Pass event data to `CalendarAddControls` as `prefillData`

**File: `src/app/spaces/[spaceId]/calendar/add-controls.tsx`**
- Accept optional `prefillData` prop
- Pre-fill form fields when provided

---

## Phase 4: Calendar Export (Feature 3)

### 4.1 iCal Format

**iCal (.ics) structure:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Couple Moments//EN
BEGIN:VEVENT
UID:event-id@couplemoments.app
DTSTART:20260121T190000
DTEND:20260121T210000
SUMMARY:Dinner at Aurora
DESCRIPTION:Our anniversary dinner
LOCATION:123 Main St
END:VEVENT
END:VCALENDAR
```

### 4.2 API Endpoint

**New file: `src/app/api/spaces/[spaceId]/calendar.ics/route.ts`**

```typescript
export async function GET(request: Request, { params }) {
  const { spaceId } = await params;
  const userId = await requireUserId();

  // Verify user has access to space
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) return new Response("Forbidden", { status: 403 });

  // Get all future events
  const events = await listEventsForSpace({
    spaceId,
    timeframe: "upcoming"
  });

  // Generate iCal content
  const ical = generateICalendar(events, space.name);

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${space.name || 'couple'}-calendar.ics"`,
    },
  });
}
```

### 4.3 Helper Function

**New file: `src/lib/ical.ts`**
```typescript
export function generateICalendar(
  events: Event[],
  calendarName: string
): string {
  // Format dates as iCal format: YYYYMMDDTHHMMSS
  // Escape special characters in text fields
  // Return full iCal string
}
```

### 4.4 UI Addition

**File: `src/app/spaces/[spaceId]/calendar/page.tsx`**
- Add "Export to Calendar" button in header
- Links to `/api/spaces/{spaceId}/calendar.ics`
- Browser downloads .ics file
- User imports into Google Calendar / Apple Calendar

**Alternative: Subscription URL**
- Instead of download, provide URL user can "subscribe" to
- Calendar apps auto-refresh subscribed calendars
- Requires: public/auth token in URL, caching headers

---

## Phase 5: Email Reminders (Feature 4)

### 5.1 Schema Additions

```prisma
model Event {
  // ... existing fields
  reminderSent  Boolean   @default(false)
}

model User {
  // ... existing fields
  emailRemindersEnabled  Boolean  @default(true)  // already exists
}
```

### 5.2 Email Service Setup

**Options (pick one):**
- **Resend** - Simple API, generous free tier (100/day)
- **SendGrid** - Industry standard, free tier available
- **AWS SES** - Cheapest at scale, more setup

**New file: `src/lib/email.ts`**
```typescript
export async function sendReminderEmail(params: {
  to: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation?: string;
  spaceId: string;
  eventId: string;
}): Promise<void>
```

**Email template:**
```
Subject: Reminder: {eventTitle} is tomorrow!

Hey {userName}!

Just a reminder that you have "{eventTitle}" planned for tomorrow.

📅 {formattedDate}
📍 {location or "No location set"}

View details: {eventUrl}

— Couple Moments
```

### 5.3 Reminder Job

**Option A: Vercel Cron (if using Vercel)**

**New file: `src/app/api/cron/reminders/route.ts`**
```typescript
export async function GET(request: Request) {
  // Verify cron secret
  // Find events happening tomorrow where reminderSent = false
  // For each event, send email to both space members
  // Mark reminderSent = true
  return Response.json({ sent: count });
}
```

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"  // 9 AM daily
  }]
}
```

**Option B: External cron (Railway, cron-job.org)**
- Same endpoint, called externally
- Add secret token verification

### 5.4 User Preferences

**File: `src/app/spaces/[spaceId]/settings/page.tsx`**
- Add toggle: "Email reminders for upcoming events"
- Updates user.emailRemindersEnabled

---

## Implementation Order

```
Week 1:
├── Day 1-2: Phase 1 (Infrastructure)
│   ├── PostgreSQL migration
│   ├── Database sessions
│   └── Test deployment on Railway
│
├── Day 3: Phase 2 (Memory Rating)
│   ├── Schema + migration
│   ├── HeartRating component
│   └── Event page integration
│
└── Day 4: Phase 3 (Quick Repeat)
    ├── URL param handling
    └── Form pre-fill logic

Week 2:
├── Day 1: Phase 4 (Calendar Export)
│   ├── iCal generation
│   └── Download endpoint
│
└── Day 2-3: Phase 5 (Email Reminders)
    ├── Email service setup
    ├── Reminder job
    └── User preferences
```

---

## Files Summary

**New files to create:**
- `src/components/ui/HeartRating.tsx`
- `src/lib/ical.ts`
- `src/lib/email.ts`
- `src/app/api/spaces/[spaceId]/calendar.ics/route.ts`
- `src/app/api/cron/reminders/route.ts`

**Files to modify:**
- `prisma/schema.prisma` (Session model, Event.rating, Event.reminderSent)
- `src/lib/prisma.ts` (remove SQLite adapter)
- `src/lib/sessions.ts` (database sessions)
- `src/lib/events.ts` (add updateEventRating)
- `src/app/events/[eventId]/page.tsx` (rating UI, repeat button)
- `src/app/spaces/[spaceId]/calendar/page.tsx` (export button, repeat prefill)
- `src/app/spaces/[spaceId]/calendar/add-controls.tsx` (prefill support)
- `src/app/spaces/[spaceId]/memories/page.tsx` (show ratings)
- `src/app/spaces/[spaceId]/settings/page.tsx` (reminder toggle)
- `package.json` (remove sqlite deps, add email lib)

---

## Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
SESSION_SECRET=<random-32-chars>

# Email (example: Resend)
RESEND_API_KEY=re_...

# Existing
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

# Cron (if not using Vercel)
CRON_SECRET=<random-string>
```

---

## Testing Checklist

### Infrastructure
- [ ] App starts with PostgreSQL
- [ ] Login persists after server restart
- [ ] Logout clears session from database
- [ ] Deploy to Railway works

### Memory Rating
- [ ] Can rate a past event 1-5 hearts
- [ ] Rating persists after page refresh
- [ ] Can change existing rating
- [ ] Rating shows on memories page

### Quick Repeat
- [ ] "Do this again" button appears on past events
- [ ] Clicking opens create form with pre-filled data
- [ ] Date/time are empty (user picks new date)
- [ ] Creating event works normally

### Calendar Export
- [ ] Download button triggers .ics download
- [ ] File imports into Google Calendar
- [ ] File imports into Apple Calendar
- [ ] Events have correct times/locations

### Email Reminders
- [ ] Toggle appears in settings
- [ ] Cron job finds tomorrow's events
- [ ] Emails send to both partners
- [ ] reminderSent flag prevents duplicates
- [ ] Disabled users don't receive emails
