# Google Calendar Integration Spec — Couple Moments

**Created:** 2026-02-05
**Owner:** Product + Engineering
**Status:** Draft

---

## Summary
Couple Moments will integrate with Google Calendar to improve availability planning and event coordination. The integration is phased:

- **Phase 1 (MVP):** Inbound availability only (busy blocks).
- **Phase 2:** Outbound event creation with real Google invitations.
- **Phase 3 (Optional):** Bidirectional sync (updates + deletions).

This spec defines user flows, permissions, data model changes, sync strategy, edge cases, UX requirements, and rollout milestones.

---

## Goals
- Provide reliable availability based on Google Calendar busy times.
- Allow optional export of Couple Moments events into Google Calendar with invite emails.
- Minimize data access with least-privilege scopes and explicit user controls.
- Keep the integration observable and recoverable (sync status, errors, revocation).

## Non-Goals (for MVP)
- Full event content sync (titles, descriptions) from Google into Couple Moments.
- Multi-provider support (Outlook/Apple) — future scope.
- Background sync guaranteed within seconds (MVP can be hourly/periodic).

---

## 1) User Flows

### 1.1 Connect Google Account (Phase 1+)
1. User opens **Settings ? Calendar Integrations**.
2. Clicks **Connect Google Calendar**.
3. OAuth consent screen (read-only for Phase 1).
4. After success, user sees:
   - Connected Google account email
   - Last sync time
   - Calendars list with toggles

### 1.2 Select Calendars (Phase 1+)
1. User chooses which calendars to include in availability.
2. Default: primary calendar selected.
3. User can choose to exclude individual calendars (e.g., work).
4. Save selection ? triggers sync.

### 1.3 View Availability (Phase 1 MVP)
- Availability view shows **busy blocks** aggregated from selected calendars.
- Busy blocks are displayed as “Busy” with a distinct style from manual blocks.
- No event titles or details shown in MVP to preserve privacy.

### 1.4 Create Event w/ Optional Google Invite (Phase 2)
1. User creates Couple Moments event.
2. Toggle: **“Also add to Google Calendar”** (default off initially).
3. If enabled:
   - Event created in selected target calendar.
   - Invite emails sent by Google to guests (if any are added in future).
4. Event detail shows link/status: “Synced to Google Calendar.”

### 1.5 Disconnect / Revoke (Phase 1+)
1. User clicks **Disconnect**.
2. App revokes local tokens and stops sync.
3. Previously imported busy blocks are removed (or marked inactive).

---

## 2) Permissions / Scopes (Least Privilege)

### Phase 1 (Inbound availability)
- **`https://www.googleapis.com/auth/calendar.readonly`**
  - Needed to list calendars and retrieve busy blocks.
  - Use `freebusy` endpoint for minimum detail.

### Phase 2 (Outbound event creation)
- **`https://www.googleapis.com/auth/calendar.events`**
  - Create/update events on user’s chosen calendar.
  - Requires re-consent (incremental auth).

### Phase 3 (Bidirectional sync)
- Continue Phase 2 scopes.
- Use sync tokens + webhooks; no new scopes required.

**Privacy principle:**
- Store minimal event data for availability (start/end only).
- Do not store Google event titles/descriptions in MVP.

---

## 3) Data Model Additions

> Prisma + Postgres, custom auth. Proposed models align with current schema.

### 3.1 OAuth Account
**Table: `ExternalAccount`**
- `id` (cuid)
- `userId` (FK User)
- `provider` (enum: GOOGLE)
- `providerAccountId` (Google user ID)
- `email`
- `accessToken` (encrypted)
- `refreshToken` (encrypted)
- `tokenExpiresAt`
- `scopes` (string[] or string)
- `createdAt`, `updatedAt`
- `revokedAt` (nullable)

### 3.2 Calendar List
**Table: `ExternalCalendar`**
- `id` (cuid)
- `externalAccountId` (FK ExternalAccount)
- `providerCalendarId`
- `name`
- `primary` (bool)
- `selected` (bool)
- `timeZone`
- `createdAt`, `updatedAt`

### 3.3 Availability Sync
**Table: `ExternalAvailabilityBlock`** (or reuse `AvailabilityBlock` with source fields)
- `id` (cuid)
- `coupleSpaceId` (FK)
- `userId` (FK)
- `externalCalendarId` (FK)
- `externalEventId` (nullable)
- `startAt`, `endAt`
- `source` = "GOOGLE"
- `createdAt`, `updatedAt`

### 3.4 Event Sync (Phase 2+)
**Table: `ExternalEventLink`**
- `id` (cuid)
- `eventId` (FK Event)
- `externalCalendarId` (FK)
- `externalEventId`
- `provider` (GOOGLE)
- `etag` (for conflict detection)
- `createdAt`, `updatedAt`

### 3.5 Sync State
**Table: `ExternalSyncState`**
- `id` (cuid)
- `externalAccountId`
- `resourceType` (CALENDAR_LIST | EVENTS | FREEBUSY)
- `syncToken` (nullable)
- `lastSyncedAt`
- `errorState` (nullable)

---

## 4) Sync Strategy

### Phase 1 (MVP)
- **Polling cadence:** every 30–60 minutes per connected account.
- **Trigger sync on:**
  - connect
  - calendar selection change
  - settings save
  - manual “Sync now” button
- **Data source:** `freebusy` endpoint with selected calendar IDs.
- **Storage:** create/update `ExternalAvailabilityBlock` entries and remove old ones outside the requested range.

### Phase 2 (Outbound)
- On event creation, insert into Google Calendar via `events.insert`.
- Store mapping in `ExternalEventLink`.
- Retry on transient errors (429/5xx) with backoff.

### Phase 3 (Optional)
- Use **Google push notifications** (webhooks) + sync tokens.
- Apply changes to local events when Google event changes.
- Conflict rules: prefer latest update timestamp unless user explicitly overrides.

---

## 5) Edge Cases

- **Timezones:**
  - Store all dates in UTC; display in user locale.
  - Respect Google calendar time zone for all-day vs timed events.

- **Recurring events:**
  - Phase 1: freebusy handles recurrence implicitly.
  - Phase 3: use instances expansion, store instance IDs for updates.

- **Canceled events:**
  - If event is canceled in Google, remove corresponding busy blocks.

- **Multiple calendars:**
  - Merge busy intervals across selected calendars.
  - Avoid duplicate blocks when multiple calendars share an event.

- **Revoked access:**
  - Mark account revoked, disable sync, show CTA to reconnect.

- **Partial data:**
  - If freebusy returns errors for one calendar, continue others and surface warning.

- **Rate limits:**
  - Respect Google API quotas, batch requests when possible.

---

## 6) UX Requirements

### Settings
- Section: **Calendar Integrations**
  - Connect/Disconnect button
  - Calendar list with toggles
  - Last sync time + error message
  - “Sync now” button
  - “What data is shared?” tooltip

### Availability View
- Busy blocks should:
  - Have a distinct color/style from manual availability blocks.
  - Show only “Busy” label in MVP.
  - Be filterable (toggle external availability on/off).

### Event Creation (Phase 2)
- Toggle: “Add to Google Calendar” on event create/edit.
- Status badge on event detail: “Synced to Google Calendar” / “Not synced”.

---

## 7) Rollout Plan / Milestones

### Milestone M3-A (Phase 1 MVP)
- [ ] OAuth integration (Google) with read-only scope.
- [ ] Calendar list UI with selection.
- [ ] Availability sync (freebusy polling).
- [ ] External busy blocks in availability view.
- [ ] Settings UX + error states.

### Milestone M3-B (Phase 2 Outbound)
- [ ] Incremental OAuth to add events scope.
- [ ] Event create ? Google calendar insert.
- [ ] Store external event links.
- [ ] Event detail shows sync status.

### Milestone M3-C (Phase 3 Optional Sync)
- [ ] Webhook subscriptions per calendar.
- [ ] Sync token support.
- [ ] Conflict handling rules.

---

## Open Questions
- Which calendar should be the default target for outbound events?
- Should availability sync be limited to a rolling window (e.g., 90 days)?
- Should “Busy” blocks be merged into existing manual availability blocks or always separate?

---

## Risks
- OAuth complexity and token refresh failures.
- Google API rate limits if multiple spaces/users sync frequently.
- User confusion about what data is imported (mitigate with UI copy).

---

## Success Metrics
- % of connected users who successfully sync availability.
- Reduction in “double-booked” events after integration.
- Event creation to Google export adoption rate.
