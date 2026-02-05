import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { encryptToken, decryptToken } from '../encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('Google Calendar integration environment variables are not configured');
}

/**
 * Create OAuth2 client for Google Calendar API
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth URL for starting the connect flow
 */
export function generateAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  console.log('Token exchange response:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiryDate: tokens.expiry_date,
    scope: tokens.scope,
  });

  if (!tokens.access_token) {
    throw new Error('No access token received from Google');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    scope: tokens.scope,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}

/**
 * Get a valid OAuth2 client for an external account (refreshes token if needed)
 */
export async function getAuthenticatedClient(externalAccountId: string) {
  const account = await prisma.externalAccount.findUnique({
    where: { id: externalAccountId },
  });
  
  if (!account) {
    throw new Error('External account not found');
  }
  
  if (account.revokedAt) {
    throw new Error('Account access has been revoked');
  }
  
  let accessToken = decryptToken(account.accessToken);
  let tokenExpiresAt = account.tokenExpiresAt;
  
  // Refresh token if expired or expiring soon (within 5 minutes)
  const needsRefresh = !tokenExpiresAt || 
    tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;
  
  if (needsRefresh && account.refreshToken) {
    try {
      const decryptedRefreshToken = decryptToken(account.refreshToken);
      const refreshed = await refreshAccessToken(decryptedRefreshToken);
      
      accessToken = refreshed.accessToken;
      tokenExpiresAt = refreshed.expiresAt;
      
      // Update the database with new access token
      await prisma.externalAccount.update({
        where: { id: externalAccountId },
        data: {
          accessToken: encryptToken(accessToken),
          tokenExpiresAt: tokenExpiresAt,
        },
      });
    } catch (error) {
      // Mark account as revoked if refresh fails
      await prisma.externalAccount.update({
        where: { id: externalAccountId },
        data: { revokedAt: new Date() },
      });
      throw new Error('Failed to refresh access token. Please reconnect your account.');
    }
  }
  
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });
  
  return oauth2Client;
}

/**
 * Fetch user's Google account info (email)
 */
export async function getGoogleAccountInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return {
    email: data.email!,
    id: data.id!,
  };
}

/**
 * List all calendars for a user's Google account
 */
export async function listGoogleCalendars(externalAccountId: string) {
  const oauth2Client = await getAuthenticatedClient(externalAccountId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const { data } = await calendar.calendarList.list();
  
  return (data.items || []).map((cal) => ({
    calendarId: cal.id!,
    summary: cal.summary || 'Unnamed Calendar',
    primary: cal.primary || false,
    backgroundColor: cal.backgroundColor,
    foregroundColor: cal.foregroundColor,
  }));
}

/**
 * Sync calendar list to database
 */
export async function syncCalendarList(externalAccountId: string) {
  const calendars = await listGoogleCalendars(externalAccountId);
  
  // Get existing calendars
  const existing = await prisma.externalCalendar.findMany({
    where: { externalAccountId },
  });
  
  type ExistingCalendar = typeof existing[number];
  const existingMap = new Map<string, ExistingCalendar>(existing.map((c: ExistingCalendar) => [c.calendarId, c]));
  
  // Update or create calendars
  for (const cal of calendars) {
    const existingCal = existingMap.get(cal.calendarId);
    
    if (existingCal) {
      // Update existing
      await prisma.externalCalendar.update({
        where: { id: existingCal.id },
        data: {
          summary: cal.summary,
          primary: cal.primary,
          backgroundColor: cal.backgroundColor,
          foregroundColor: cal.foregroundColor,
        },
      });
    } else {
      // Create new, default primary to selected
      await prisma.externalCalendar.create({
        data: {
          externalAccountId,
          calendarId: cal.calendarId,
          summary: cal.summary,
          primary: cal.primary,
          selected: cal.primary, // Auto-select primary calendar
          backgroundColor: cal.backgroundColor,
          foregroundColor: cal.foregroundColor,
        },
      });
    }
    
    existingMap.delete(cal.calendarId);
  }
  
  // Delete calendars that no longer exist
  for (const [_, cal] of existingMap.entries()) {
    await prisma.externalCalendar.delete({
      where: { id: cal.id },
    });
  }
  
  return calendars;
}
