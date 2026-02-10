# Technical Plan: Google Calendar Integration

Created: 2026-02-05
Updated: 2026-02-10
Status: Phase 1 and Phase 2 complete; Phase 3 backlog
Source: `docs/90_archive/GOOGLE_CALENDAR_INTEGRATION_SPEC.md`

---

## Scope summary
- Phase 1 (implemented): inbound availability sync from Google calendars
- Phase 2 (implemented): outbound event creation to Google Calendar
- Phase 3 (backlog): bidirectional sync lifecycle and webhook/cron automation

---

## Implemented architecture

### OAuth and account linkage
Routes:
- `GET /api/integrations/google/start`
- `GET /api/integrations/google/callback`
- `DELETE /api/integrations/google/disconnect`

Behavior:
- OAuth flow stores account and token metadata
- Tokens are encrypted before persistence
- Settings supports connect/disconnect and calendar selection

### Calendar discovery and selection
Routes:
- `GET /api/integrations/google/calendars`
- `POST /api/integrations/google/calendars/toggle`

Behavior:
- Fetch and persist available calendars
- Toggle selected calendars for busy sync inclusion

### Inbound availability sync (Phase 1)
Route:
- `POST /api/integrations/google/sync`

Behavior:
- Sync selected calendar busy windows
- Persist external availability blocks for rendering in calendar UI

### Outbound event sync (Phase 2)
Behavior:
- Event creation supports "Add to Google Calendar"
- Idea-to-event scheduling supports same toggle
- Linked external event metadata is persisted (`ExternalEventLink`)
- Event detail surfaces sync status when link exists

---

## Environment variables
Required for Google integration:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `TOKEN_ENCRYPTION_KEY`

---

## Remaining backlog (Phase 3+)

- [ ] Periodic sync trigger (cron/job)
- [x] Update/delete propagation when Duet events change
- [ ] Webhook-based incremental sync strategy
- [ ] Conflict handling policy and retry/backoff hardening
- [ ] Provider abstraction for non-Google calendars

---

## Validation checklist

- [ ] Connect Google account from settings
- [ ] Select/deselect calendars and confirm busy block updates
- [ ] Create event with Google toggle and verify external event created
- [ ] Schedule idea with Google toggle and verify external event created
- [ ] Disconnect account and verify sync paths are disabled
