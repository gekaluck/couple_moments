# Technical Plan: Google Calendar Integration

**Created:** 2026-02-05
**Status:** Draft
**Source:** docs/00_current/GOOGLE_CALENDAR_INTEGRATION_SPEC.md

---

## Scope
Phase 1 (MVP): inbound availability only (busy blocks).
Phase 2: outbound event creation + Google invite emails.
Phase 3 (optional): bidirectional sync.

---

## Dependencies
- Google Cloud project + OAuth consent screen
- OAuth client (web application)
- Environment variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `TOKEN_ENCRYPTION_KEY` (for encrypting refresh/access tokens)

---

## Data Model (Prisma)

Add new models (from spec):

- `ExternalAccount`
- `ExternalCalendar`
- `ExternalAvailabilityBlock` (or reuse AvailabilityBlock with source fields)
- `ExternalEventLink` (Phase 2+)
- `ExternalSyncState`

Migration steps:
1. Add models to `prisma/schema.prisma`.
2. Run `npx prisma migrate dev -n add_google_calendar_models`.
3. Generate client.

---

## Phase 1 Implementation (Inbound Availability)

### 1) OAuth connect flow
**Routes:**
- `GET /api/integrations/google/start`
- `GET /api/integrations/google/callback`

**Flow:**
1. Start route builds OAuth URL with `calendar.readonly` scope and `access_type=offline`.
2. Callback route exchanges code for tokens.
3. Store tokens in `ExternalAccount` (encrypted).
4. Redirect back to Settings with success banner.

**Security:**
- Validate `state` param (store nonce in signed cookie).
- Encrypt tokens before persisting.

### 2) Calendar discovery
**Service:** `src/lib/integrations/google/calendar.ts`
- `listGoogleCalendars(externalAccountId)`
- Store in `ExternalCalendar` with `selected` default (primary = true).

### 3) Availability sync
**Service:** `src/lib/integrations/google/freebusy.ts`
- Use `freebusy` endpoint with selected calendar IDs.
- Window: rolling 60-90 days (confirm) or per view window.
- Store blocks in `ExternalAvailabilityBlock` with `source = GOOGLE`.

**Sync triggers:**
- After connect
- After calendar selection update
- Manual "Sync now" action
- Scheduled job (cron)

### 4) Settings UI
**Page:** add section in settings page
- Connect/Disconnect buttons
- Calendar list with toggles
- Last sync time + error state
- "Sync now" button

### 5) Availability view
- Render external busy blocks distinct from manual `AvailabilityBlock`.
- Toggle to show/hide external availability (per user or global).

---

## Phase 2 Implementation (Outbound Events)

### 1) Incremental OAuth
- Request `calendar.events` scope when user enables outbound sync.
- If user already connected, re-run OAuth consent flow.

### 2) Event creation hook
- When creating a Duet event, allow optional toggle:
  - `addToGoogleCalendar = true`
- Create Google event via `events.insert`.
- Store `ExternalEventLink` with `externalEventId`, `etag`.

### 3) Event detail status
- Show "Synced" badge when link exists.
- Allow "Remove from Google" (optional).

---

## Phase 3 Implementation (Bidirectional Sync)

### 1) Webhooks
- Register watch channel per selected calendar.
- Store channel + resource IDs in `ExternalSyncState`.
- On notification, use `syncToken` to fetch updates.

### 2) Conflict resolution
- Compare `updated` timestamps.
- Default rule: most recent wins; log conflicts.

---

## Background Jobs

- Add scheduled job entry (platform-specific cron):
  - `scripts/google-sync.ts` (polling per account)
- Job steps:
  1. Refresh access token (if expired)
  2. Pull calendar list (optional daily)
  3. Run freebusy sync for selected calendars
  4. Update `ExternalSyncState.lastSyncedAt`

---

## Error Handling
- Token refresh failure: mark account `revokedAt`, surface reconnect CTA.
- Partial calendar failures: keep others, log error state on account.
- API 429/5xx: retry with backoff; stop after N retries.

---

## Testing Plan

### Unit
- URL validation for OAuth state, token storage encryption.
- Freebusy response parsing.

### Integration
- Connect flow end-to-end (OAuth mock).
- Calendar list selection -> sync.

### Manual
- Connect, select calendar, see busy blocks.
- Disable a calendar, blocks removed.
- Revoke access in Google -> app shows reconnect.

---

## Rollout Milestones

### M3-A (Phase 1 MVP)
- OAuth connect + calendar selection
- Freebusy sync + external availability rendering
- Settings UI + manual sync

### M3-B (Phase 2)
- Incremental auth
- Event creation to Google + status badge

### M3-C (Phase 3)
- Webhook sync + conflict handling

---

## Open Questions
- Availability sync window (default 60 or 90 days?)
- Where to show external availability toggles (global vs per user)?
- Should external blocks be stored separately or merged into AvailabilityBlock with `source`?

