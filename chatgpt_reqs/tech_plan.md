0. Document Purpose

This document defines the technical architecture and implementation plan for the MVP of Couple Moments, a web app for couples to:

Plan dates on a shared calendar

Capture memories with photos & impressions

Maintain an inbox of ideas

React and comment on events

Receive email reminders for planned dates

It is written so that a coding model/agent can use it as a source of truth when implementing the app.

1. High-Level Overview
1.1 Product Summary

Multi-tenant web app: multiple couples, each in their own Couple Space.

Each Couple Space has:

Shared calendar of Events (planned dates + memories)

Memories timeline (past events with photos)

Ideas inbox (unscheduled ideas, including ones converted into events)

Reactions + comments on events

Basic change log for events & ideas

Email reminders for planned events

1.2 Target Stack

We will base the MVP on:

Frontend / Backend: Next.js 15+
 (App Router)

Language: TypeScript

Styling: Tailwind CSS

Auth: Credentials-based (email + password) via custom solution or NextAuth Credentials provider

DB Layer: Prisma ORM

Database: PostgreSQL (Supabase/Railway/local Postgres — provider-agnostic)

File Storage: Cloud object storage (e.g. Supabase Storage or S3-style API; model should implement generic S3-compatible abstractions where possible)

Email: Provider-agnostic API (e.g., Resend/SendGrid). Implementation should be abstracted behind a simple sendEmail() util.

2. Architecture
2.1 Logical Architecture

Next.js app (App Router):

Serves UI

Exposes JSON API routes under /api/*

Handles server-side rendering and server actions where appropriate

PostgreSQL + Prisma:

Stores users, couple spaces, events, ideas, photos, reactions, logs, notifications

Object Storage:

Stores images for events (photos)

Email Service:

Sends email reminders for upcoming events

Background Task / Scheduler:

A scheduled job (cron) that:

Queries upcoming events for the day

Sends reminder emails

2.2 Multi-Tenancy

Each Couple Space has its own id

All main data entities are scoped by coupleSpaceId

Users can belong to one or more Couple Spaces via Membership, but MVP assumes exactly 2 members per space

3. Data Model (Prisma-style)

NOTE FOR MODEL:
Use this as the canonical schema. You may adjust names slightly if needed, but keep semantics consistent.

model User {
  id            String        @id @default(cuid())
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  email         String        @unique
  passwordHash  String
  name          String?

  // Notification preferences
  emailRemindersEnabled Boolean @default(true)

  memberships   Membership[]
  eventsCreated Event[]        @relation("EventsCreatedBy")
  photos        Photo[]
  reactions     Reaction[]
  comments      Comment[]
  changeLogs    ChangeLogEntry[]
  notifications Notification[]
}

model CoupleSpace {
  id          String        @id @default(cuid())
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  name        String?
  inviteCode  String        @unique // used to join a space via link/code

  memberships Membership[]
  events      Event[]
  ideas       Idea[]
}

model Membership {
  id            String       @id @default(cuid())
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  userId        String
  coupleSpaceId String
  role          String       @default("member")

  user          User         @relation(fields: [userId], references: [id])
  coupleSpace   CoupleSpace  @relation(fields: [coupleSpaceId], references: [id])

  @@unique([userId, coupleSpaceId])
}

model Event {
  id              String       @id @default(cuid())
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  coupleSpaceId   String
  createdByUserId String
  title           String
  description     String?
  type            EventType    // PLANNED or MEMORY

  dateTimeStart   DateTime
  dateTimeEnd     DateTime?

  tags            String[]     @default([])

  coupleSpace     CoupleSpace  @relation(fields: [coupleSpaceId], references: [id])
  createdBy       User         @relation("EventsCreatedBy", fields: [createdByUserId], references: [id])

  photos          Photo[]
  reactions       Reaction[]
  comments        Comment[]
  changeLogs      ChangeLogEntry[]
  ideasLinked     Idea[]       @relation("IdeaLinkedEvent")
  notifications   Notification[]
}

enum EventType {
  PLANNED
  MEMORY
}

model Photo {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())

  eventId     String
  uploadedByUserId String
  storageUrl  String

  event       Event     @relation(fields: [eventId], references: [id])
  uploadedBy  User      @relation(fields: [uploadedByUserId], references: [id])
}

model Idea {
  id              String      @id @default(cuid())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  coupleSpaceId   String
  createdByUserId String
  title           String
  description     String?
  tags            String[]    @default([])
  status          IdeaStatus  @default(NEW)

  linkedEventId   String?     // when converted into an Event

  coupleSpace     CoupleSpace @relation(fields: [coupleSpaceId], references: [id])
  createdBy       User        @relation(fields: [createdByUserId], references: [id])
  linkedEvent     Event?      @relation("IdeaLinkedEvent", fields: [linkedEventId], references: [id])

  changeLogs      ChangeLogEntry[]
}

enum IdeaStatus {
  NEW
  PLANNED
  DONE
}

model Reaction {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  eventId   String
  userId    String
  emoji     String
  comment   String?

  event     Event    @relation(fields: [eventId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

model Comment {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  eventId   String
  userId    String
  content   String   // short text

  event     Event    @relation(fields: [eventId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

model ChangeLogEntry {
  id          String      @id @default(cuid())
  createdAt   DateTime    @default(now())

  entityType  EntityType
  entityId    String      // Event.id or Idea.id etc.
  userId      String
  changeType  ChangeType
  summary     String      // human-readable description

  user        User        @relation(fields: [userId], references: [id])
}

enum EntityType {
  EVENT
  IDEA
}

enum ChangeType {
  CREATE
  UPDATE
  DELETE
}

model Notification {
  id            String      @id @default(cuid())
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userId        String
  eventId       String
  type          NotificationType
  scheduledAt   DateTime
  sentAt        DateTime?

  user          User        @relation(fields: [userId], references: [id])
  event         Event       @relation(fields: [eventId], references: [id])
}

enum NotificationType {
  REMINDER_UPCOMING_EVENT
}

4. API Design (HTTP / JSON)

NOTE FOR MODEL:
Implement these as Next.js route handlers under /app/api/... (App Router).
All routes require authentication unless explicitly marked public.

4.1 Auth

POST /api/auth/register

Body: { email, password, name? }

Behavior:

Hash password (e.g., bcrypt).

Create User.

Return a session token (or set HTTP-only cookie).

POST /api/auth/login

Body: { email, password }

Behavior:

Verify credentials.

Return / set session.

POST /api/auth/logout

Clears session cookie.

4.2 Couple Spaces

GET /api/couple-spaces

Returns list of CoupleSpaces for current user.

POST /api/couple-spaces

Body: { name? }

Creates CoupleSpace with generated inviteCode.

Adds current user as Membership.

GET /api/couple-spaces/:id

Returns details for a given CoupleSpace if user is member.

GET /api/couple-spaces/:id/invite

Returns invite info: { inviteCode, inviteUrl }.

POST /api/couple-spaces/join

Body: { inviteCode }

Adds current user as member of that CoupleSpace if slot available.

4.3 Events

GET /api/couple-spaces/:spaceId/events

Query params:

from (ISO date, optional)

to (ISO date, optional)

type (PLANNED or MEMORY, optional)

Returns list of events.

GET /api/events/:eventId

Details of single Event (with photos, reactions, comments if needed).

POST /api/couple-spaces/:spaceId/events

Body (MVP):

{
  "title": "string",
  "description": "string?",
  "type": "PLANNED" | "MEMORY",
  "dateTimeStart": "ISO",
  "dateTimeEnd": "ISO or null",
  "tags": ["string", "..."],
  "linkedIdeaId": "string | null"
}


Behavior:

Create Event.

If linkedIdeaId provided:

Set idea.status = PLANNED, linkedEventId = event.id.

Create ChangeLogEntry for Idea.

Create ChangeLogEntry for Event (CREATE).

If type = PLANNED: schedule notifications.

PUT /api/events/:eventId

Body: partial update (title, description, type, times, tags).

Behavior:

Update event.

Create ChangeLogEntry (UPDATE) with summary.

DELETE /api/events/:eventId

Behavior:

Delete or soft-delete Event.

Create ChangeLogEntry (DELETE).

4.4 Photos

POST /api/events/:eventId/photos

Multipart form-data: file = image

Behavior:

Upload to storage.

Create Photo record.

Response: { id, storageUrl }.

DELETE /api/photos/:photoId

Delete Photo and underlying file.

4.5 Ideas

GET /api/couple-spaces/:spaceId/ideas

Optional query: status

Returns list of ideas.

POST /api/couple-spaces/:spaceId/ideas

Body: { title, description?, tags? }

Creates Idea with status NEW.

ChangeLogEntry (CREATE).

PUT /api/ideas/:ideaId

Update title, description, tags, status.

ChangeLogEntry (UPDATE).

DELETE /api/ideas/:ideaId

ChangeLogEntry (DELETE).

POST /api/ideas/:ideaId/convert-to-event

Body: { dateTimeStart, dateTimeEnd?, type? } (type default PLANNED)

Behavior:

Create Event with idea title.

Update Idea: status PLANNED, set linkedEventId.

Log change for both.

4.6 Reactions & Comments

POST /api/events/:eventId/reactions

Body: { emoji, comment? }

Creates Reaction.

DELETE /api/reactions/:reactionId

Deletes reaction (only by owner).

POST /api/events/:eventId/comments

Body: { content }

Creates Comment.

PUT /api/comments/:commentId

Update comment (only by owner).

DELETE /api/comments/:commentId

Delete comment (only by owner).

4.7 Inbox & Timeline

These can be built as frontend compositions of existing endpoints; no special endpoints required beyond Events + Ideas.

Inbox View:

Ideas where status = NEW + upcoming Events (type = PLANNED, dateTimeStart >= now, limited to next X days).

Memories View:

Events where type = MEMORY.

5. Email Notifications & Scheduling
5.1 Reminder Logic (MVP)

When Event.type = PLANNED:

For each member of the CoupleSpace with emailRemindersEnabled = true:

Create Notification record:

type = REMINDER_UPCOMING_EVENT

scheduledAt = 09:00 local time on the day of dateTimeStart

sentAt = null

NOTE FOR MODEL:
Don’t overcomplicate time zones yet — default to one server/local timezone or store user timezone as a simple string later. MVP can assume a single timezone if necessary.

5.2 Scheduled Job

Implement a cron-like job (depending on hosting):

Pseudo-algorithm:

Every X minutes (e.g. 10 mins), run job:

Find all Notification where:

type = REMINDER_UPCOMING_EVENT

sentAt IS NULL

scheduledAt <= now()

For each:

Fetch User + Event.

Call sendEmailReminder(user, event).

Set sentAt = now().

6. Frontend Structure (Next.js App Router)

NOTE FOR MODEL:
Use App Router structure under /app.
Below is a suggested page layout; you can tweak URLs if needed.

6.1 Top-Level Pages

/

If not authenticated → redirect to /login.

If authenticated:

If no CoupleSpace → onboarding to create/join.

If has CoupleSpace(s) → redirect to primary CoupleSpace dashboard: /spaces/:id/calendar.

/login

/register

6.2 Couple Space Area

Everything scoped by spaceId.

/spaces/:spaceId/calendar

Month view with:

Calendar grid.

Click date → list of events on side + “Add Event” button.

/spaces/:spaceId/memories

Timeline of Events where type = MEMORY.

/spaces/:spaceId/ideas

List of ideas (with status pill, tags).

/spaces/:spaceId/inbox

“New” Ideas + upcoming Events.

Individual entities:

/events/:eventId

Full event page:

Photos, description, tags

Reactions

Comments

Collapsible “History” (change log)

(Optional) /ideas/:ideaId

Detailed idea view (or just manage via list).

6.3 Components (Example Breakdown)

components/layout/Header.tsx

components/layout/Sidebar.tsx

components/calendar/MonthlyCalendar.tsx

components/events/EventCard.tsx

components/events/EventForm.tsx

components/events/EventDetails.tsx

components/photos/PhotoGrid.tsx

components/ideas/IdeaCard.tsx

components/ideas/IdeaForm.tsx

components/reactions/ReactionBar.tsx

components/comments/CommentList.tsx

components/comments/CommentForm.tsx

components/changelog/ChangeLogList.tsx

7. Implementation Order / Milestones

NOTE FOR MODEL:
When asked to “start implementing”, follow this rough order unless the user explicitly changes it.

Project Setup

Initialize Next.js + TypeScript + Tailwind.

Set up ESLint/Prettier basic config.

Database & Prisma

Set up Prisma with PostgreSQL.

Implement schema from this doc.

Run migrations.

Auth

Implement register/login/logout APIs.

Implement session (HTTP-only cookie or use NextAuth Credentials).

Protect /app routes with server-side checks.

Couple Space Management

Create/join couple spaces.

Basic UI to create/join via invite code.

Redirect user into /spaces/:id/calendar.

Events CRUD + Calendar UI

Implement Events API.

Build calendar view + event create/edit modal.

Store ChangeLogEntries on create/update/delete.

Ideas CRUD + Conversion to Events

Implement Ideas API.

Build Ideas list & create/edit.

Implement “Schedule this” flow → create Event + link Idea.

Memories & Inbox Views

Implement memories timeline view.

Implement inbox view (new ideas + upcoming events).

Photos Upload UI

Implement file upload endpoint + storage.

Add photo upload to event form/details.

Render photo grid.

Reactions & Comments

Implement Reaction & Comment APIs.

Build ReactionBar & CommentList UI.

Email Notifications

Implement Notification creation logic for planned events.

Implement scheduled job + sendEmail util.

Test flow end-to-end.

Polish & Non-Functional

Responsive layouts.

Basic error handling, loading states.

Input validation on APIs.

8. Conventions & Guidelines for the Model

This section is specifically for the coding model that will use this doc.

8.1 Role

You are a Senior Full-Stack TypeScript/Next.js Engineer implementing the Couple Moments MVP according to this plan.

8.2 General Rules

Follow this document as the primary source of truth.

If there is ambiguity:

Choose the simplest reasonable solution that matches the spirit of the app.

Clearly document assumptions in comments or markdown.

Prefer:

TypeScript types/interfaces.

Clear separation of concerns (API vs UI).

Use:

Next.js App Router.

File-based routing.

Tailwind for styling.

8.3 Coding Style

Use ESLint-preferred patterns and idiomatic React/Next patterns.

Prefer functional components and React hooks.

Use async/await with proper error handling.

Validate API inputs (at least basic type checks; optional: Zod).

8.4 When Writing Code

Include only relevant files for each step (no noisy scaffolding).

Use descriptive names for components and utils.

Before finalizing a piece of work:

Ensure it compiles logically (no obvious type mismatches).

Ensure imports are consistent.

8.5 Example Tasks You Might Receive

“Implement Prisma schema based on TECH_PLAN.md and show the schema.prisma file.”

“Create the API route for creating events under /app/api/couple-spaces/[spaceId]/events/route.ts.”

“Build the React component for the month calendar view fetching events from the API.”

“Add logic to create Notification records when a PLANNED event is created.”