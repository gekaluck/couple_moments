# Google Calendar Integration - Phase 1 Implementation

## Overview
Phase 1 of Google Calendar integration has been successfully implemented. This phase provides **inbound availability only** - syncing busy times from Google Calendar to block those times in Duet.

## What Was Implemented

### 1. Database Schema
Added four new models to support Google Calendar integration:
- **ExternalAccount**: Stores OAuth credentials for Google Calendar connections
- **ExternalCalendar**: Lists available calendars for each connected account
- **ExternalAvailabilityBlock**: Stores busy times synced from Google Calendar
- **ExternalSyncState**: Tracks sync status and errors

### 2. Backend Services
- **Token Encryption** (`src/lib/integrations/encryption.ts`): Secure encryption/decryption for OAuth tokens using AES-256-GCM
- **Google Calendar Service** (`src/lib/integrations/google/calendar.ts`): OAuth flow, token refresh, calendar discovery
- **FreeBusy Service** (`src/lib/integrations/google/freebusy.ts`): Syncs busy blocks from Google Calendar

### 3. API Routes
- `GET /api/integrations/google/start`: Initiates OAuth flow
- `GET /api/integrations/google/callback`: Handles OAuth callback
- `GET /api/integrations/google/calendars`: Lists connected calendars
- `POST /api/integrations/google/calendars/toggle`: Toggle calendar selection
- `POST /api/integrations/google/sync`: Manually trigger sync
- `DELETE /api/integrations/google/disconnect`: Disconnect Google Calendar

### 4. UI Components
- **Settings UI** (`src/app/spaces/[spaceId]/settings/google-calendar-settings.tsx`): 
  - Connect/disconnect Google Calendar
  - View connected account
  - Toggle which calendars to sync
  - Manual sync button
  - Last sync status display
- **Calendar View**: Updated to display external busy blocks alongside manual availability blocks

## Environment Variables Required

Before using this feature, add these environment variables to your `.env` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

# Token Encryption Key (32 bytes, base64-encoded)
TOKEN_ENCRYPTION_KEY=your-base64-encoded-32-byte-key
```

### Setting Up Google OAuth

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Calendar API

2. **Create OAuth Credentials**:
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/integrations/google/callback` (development)
     - `https://yourdomain.com/api/integrations/google/callback` (production)

3. **Configure OAuth Consent Screen**:
   - Add your app name, email, and logo
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly`
   - Add test users (for development)

4. **Generate Encryption Key**:
   ```bash
   # Generate a random 32-byte key and encode it as base64
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

## How It Works

### User Flow
1. User navigates to Settings page
2. Clicks "Connect Google Calendar"
3. Redirects to Google OAuth consent screen
4. User grants calendar read permissions
5. Redirects back to app with authorization code
6. App exchanges code for access/refresh tokens
7. Tokens are encrypted and stored in database
8. App automatically fetches calendar list
9. Primary calendar is auto-selected
10. Initial sync fetches busy times (90 days ahead)
11. External busy blocks appear on calendar view

### Sync Behavior
- **Initial sync**: Triggered immediately after connecting
- **Manual sync**: Via "Sync Now" button in Settings
- **Automatic sync**: Not yet implemented (Phase 1 focus is manual/on-demand)
- **Sync window**: 90 days from current date
- **Token refresh**: Automatic when access token expires

### External Block Display
- Shown as dashed border blocks on calendar
- Labeled as "Busy (User Name)"
- Colored in neutral gray to distinguish from manual blocks
- Non-editable (no click-through to edit)
- Synced from all selected calendars

## Testing

### Manual Testing Steps
1. Set up environment variables
2. Restart the development server
3. Navigate to Settings page
4. Click "Connect Google Calendar"
5. Authorize the application
6. Verify connected account appears
7. Toggle calendar selections
8. Click "Sync Now" and verify blocks appear on calendar
9. Test disconnecting and reconnecting

### Edge Cases to Test
- [ ] Token expiration and automatic refresh
- [ ] Revoking access from Google side
- [ ] Multiple calendars with overlapping events
- [ ] All-day events
- [ ] Multi-day events
- [ ] Sync with empty calendar
- [ ] Sync errors and error messages

## What's NOT Included (Future Phases)

### Phase 2: Outbound Event Creation
- Create Google Calendar events from Duet
- Send Google Calendar invites
- Sync event updates

### Phase 3: Bidirectional Sync
- Webhook notifications for calendar changes
- Incremental sync using sync tokens
- Conflict resolution

## Known Limitations

1. **Manual Sync Only**: Background/scheduled sync not implemented
2. **No Event Creation**: Can only read busy times, not create events
3. **No Webhooks**: Changes in Google Calendar require manual sync
4. **90-Day Window**: Only syncs 90 days ahead (configurable in code)
5. **Primary Calendar Auto-Select**: Only primary calendar is auto-selected on first connect

## Files Modified/Created

### New Files
- `src/lib/integrations/encryption.ts`
- `src/lib/integrations/google/calendar.ts`
- `src/lib/integrations/google/freebusy.ts`
- `src/app/api/integrations/google/start/route.ts`
- `src/app/api/integrations/google/callback/route.ts`
- `src/app/api/integrations/google/calendars/route.ts`
- `src/app/api/integrations/google/calendars/toggle/route.ts`
- `src/app/api/integrations/google/sync/route.ts`
- `src/app/api/integrations/google/disconnect/route.ts`
- `src/app/spaces/[spaceId]/settings/google-calendar-settings.tsx`

### Modified Files
- `prisma/schema.prisma`: Added 4 new models
- `src/lib/availability.ts`: Updated to return both manual and external blocks
- `src/app/spaces/[spaceId]/settings/page.tsx`: Added GoogleCalendarSettings component
- `src/app/spaces/[spaceId]/calendar/page.tsx`: Updated to handle external blocks
- `src/app/spaces/[spaceId]/calendar/day-cell.tsx`: Updated to render external blocks

### Database Migration
- `prisma/migrations/20260205045428_add_google_calendar_models/migration.sql`

## Next Steps

1. **Set up Google Cloud project** and obtain OAuth credentials
2. **Add environment variables** to `.env` file
3. **Test the integration** with a real Google account
4. **Monitor for errors** in sync state
5. **Consider implementing** background sync job for Phase 1.5
6. **Plan Phase 2** for event creation and Google invites

