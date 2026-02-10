import { google, calendar_v3 } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedClient } from './calendar';

type DuetEvent = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  dateTimeEnd: Date | null;
  timeIsSet: boolean;
  placeName: string | null;
  placeAddress: string | null;
};

export type GoogleSyncCode =
  | 'NOT_CONNECTED'
  | 'ALREADY_SYNCED'
  | 'NO_PRIMARY_CALENDAR'
  | 'NOT_SYNCED'
  | 'ACCOUNT_REVOKED'
  | 'MISSING_EXTERNAL_EVENT'
  | 'TRANSIENT_ERROR'
  | 'API_ERROR';

export type GoogleSyncResult = {
  success: boolean;
  code?: GoogleSyncCode;
  error?: string;
  externalEventId?: string;
  recovered?: boolean;
  skipped?: boolean;
};

export type GoogleEventDeleteContext = {
  externalAccountId: string;
  calendarId: string;
  externalEventId: string;
  accountRevoked: boolean;
};

const RETRYABLE_HTTP_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNABORTED',
  'EAI_AGAIN',
  'ENOTFOUND',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorStatus(error: unknown): number | null {
  if (!isRecord(error) || !('response' in error)) {
    return null;
  }
  const response = error.response;
  if (!isRecord(response) || !('status' in response)) {
    return null;
  }
  const status = response.status;
  return typeof status === 'number' ? status : null;
}

function getErrorCode(error: unknown): string | null {
  if (!isRecord(error) || !('code' in error)) {
    return null;
  }
  const code = error.code;
  return typeof code === 'string' ? code : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

function isRetryableGoogleError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== null && RETRYABLE_HTTP_STATUS.has(status)) {
    return true;
  }
  const code = getErrorCode(error);
  return code !== null && RETRYABLE_NETWORK_CODES.has(code);
}

function isGoogleNotFoundError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableGoogleError(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      await delay(300 * 2 ** attempt);
    }
  }

  throw lastError;
}

async function getInviteAttendees(
  eventId: string,
  organizerUserId: string,
): Promise<calendar_v3.Schema$EventAttendee[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      coupleSpace: {
        select: {
          memberships: {
            select: {
              userId: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return [];
  }

  const emails = new Set<string>();
  const attendees: calendar_v3.Schema$EventAttendee[] = [];

  for (const membership of event.coupleSpace.memberships) {
    if (membership.userId === organizerUserId) {
      continue;
    }
    const email = membership.user.email.trim().toLowerCase();
    if (!email || emails.has(email)) {
      continue;
    }
    emails.add(email);
    attendees.push({
      email,
      displayName: membership.user.name ?? undefined,
    });
  }

  return attendees;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function toExclusiveEndDate(event: DuetEvent): string {
  const lastDay = event.dateTimeEnd ? new Date(event.dateTimeEnd) : new Date(event.dateTimeStart);
  lastDay.setDate(lastDay.getDate() + 1);
  return toIsoDate(lastDay);
}

/**
 * Check if user has Google Calendar connected with events scope
 */
export async function hasGoogleCalendarWithEventsScope(userId: string): Promise<boolean> {
  const account = await prisma.externalAccount.findFirst({
    where: {
      userId,
      provider: 'GOOGLE',
      revokedAt: null,
    },
  });

  if (!account || !account.scope) {
    return false;
  }

  return account.scope.includes('calendar.events');
}

/**
 * Get the user's primary Google Calendar ID
 */
async function getPrimaryCalendarId(externalAccountId: string): Promise<string | null> {
  const calendar = await prisma.externalCalendar.findFirst({
    where: {
      externalAccountId,
      primary: true,
    },
  });

  return calendar?.calendarId || null;
}

/**
 * Create a Google Calendar event from a Duet event
 */
export async function createGoogleCalendarEvent(
  userId: string,
  event: DuetEvent
): Promise<GoogleSyncResult> {
  try {
    // Get user's Google account
    const account = await prisma.externalAccount.findFirst({
      where: {
        userId,
        provider: 'GOOGLE',
        revokedAt: null,
      },
    });

    if (!account) {
      return {
        success: false,
        code: 'NOT_CONNECTED',
        error: 'No Google account connected',
      };
    }

    // Check if already linked
    const existingLink = await prisma.externalEventLink.findUnique({
      where: { eventId: event.id },
    });

    if (existingLink) {
      return {
        success: false,
        code: 'ALREADY_SYNCED',
        error: 'Event already synced to Google Calendar',
      };
    }

    // Get primary calendar
    const calendarId = await getPrimaryCalendarId(account.id);
    if (!calendarId) {
      return {
        success: false,
        code: 'NO_PRIMARY_CALENDAR',
        error: 'No primary calendar found',
      };
    }

    // Get authenticated client
    const oauth2Client = await getAuthenticatedClient(account.id);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build Google Calendar event
    const endTime = event.dateTimeEnd || new Date(event.dateTimeStart.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    const attendees = await getInviteAttendees(event.id, userId);

    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description || undefined,
      location: event.placeName
        ? `${event.placeName}${event.placeAddress ? `, ${event.placeAddress}` : ''}`
        : undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
    };

    if (event.timeIsSet) {
      // Timed event
      googleEvent.start = {
        dateTime: event.dateTimeStart.toISOString(),
      };
      googleEvent.end = {
        dateTime: endTime.toISOString(),
      };
    } else {
      // All-day event
      googleEvent.start = {
        date: toIsoDate(event.dateTimeStart),
      };
      googleEvent.end = {
        date: toExclusiveEndDate(event),
      };
    }

    // Insert event
    const response = await withRetry(() =>
      calendar.events.insert({
        calendarId,
        sendUpdates: 'all',
        requestBody: googleEvent,
      }),
    );

    if (!response.data.id) {
      return {
        success: false,
        code: 'API_ERROR',
        error: 'Failed to create Google Calendar event',
      };
    }

    // Store the link
    await prisma.externalEventLink.create({
      data: {
        eventId: event.id,
        externalAccountId: account.id,
        externalEventId: response.data.id,
        calendarId,
        etag: response.data.etag || null,
        lastSyncedAt: new Date(),
      },
    });

    return { success: true, externalEventId: response.data.id };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return {
      success: false,
      code: isRetryableGoogleError(error) ? 'TRANSIENT_ERROR' : 'API_ERROR',
      error: getErrorMessage(error),
    };
  }
}

/**
 * Update a Google Calendar event from a Duet event
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  event: DuetEvent
): Promise<GoogleSyncResult> {
  try {
    // Get existing link
    const link = await prisma.externalEventLink.findUnique({
      where: { eventId },
      include: { externalAccount: true },
    });

    if (!link) {
      return {
        success: false,
        code: 'NOT_SYNCED',
        error: 'Event not synced to Google Calendar',
      };
    }

    if (link.externalAccount.revokedAt) {
      return {
        success: false,
        code: 'ACCOUNT_REVOKED',
        error: 'Google account access revoked',
      };
    }

    // Get authenticated client
    const oauth2Client = await getAuthenticatedClient(link.externalAccountId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Build updated event
    const endTime = event.dateTimeEnd || new Date(event.dateTimeStart.getTime() + 2 * 60 * 60 * 1000);
    const attendees = await getInviteAttendees(eventId, link.externalAccount.userId);

    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description || undefined,
      location: event.placeName
        ? `${event.placeName}${event.placeAddress ? `, ${event.placeAddress}` : ''}`
        : undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
    };

    if (event.timeIsSet) {
      googleEvent.start = {
        dateTime: event.dateTimeStart.toISOString(),
      };
      googleEvent.end = {
        dateTime: endTime.toISOString(),
      };
    } else {
      googleEvent.start = {
        date: toIsoDate(event.dateTimeStart),
      };
      googleEvent.end = {
        date: toExclusiveEndDate(event),
      };
    }

    // Update event
    let responseData: calendar_v3.Schema$Event;
    try {
      responseData = await withRetry(() =>
        calendar.events
          .update({
            calendarId: link.calendarId,
            eventId: link.externalEventId,
            sendUpdates: 'all',
            requestBody: googleEvent,
          })
          .then((response) => response.data),
      );
    } catch (error) {
      if (isGoogleNotFoundError(error)) {
        await prisma.externalEventLink.delete({ where: { eventId } }).catch(() => undefined);
        const recreateResult = await createGoogleCalendarEvent(
          link.externalAccount.userId,
          event,
        );
        if (recreateResult.success) {
          return {
            success: true,
            recovered: true,
            externalEventId: recreateResult.externalEventId,
          };
        }
        return {
          success: false,
          code: recreateResult.code ?? 'MISSING_EXTERNAL_EVENT',
          error:
            recreateResult.error ??
            'Linked Google event was missing and could not be recreated',
        };
      }
      return {
        success: false,
        code: isRetryableGoogleError(error) ? 'TRANSIENT_ERROR' : 'API_ERROR',
        error: getErrorMessage(error),
      };
    }

    // Update link
    await prisma.externalEventLink.update({
      where: { eventId },
      data: {
        etag: responseData.etag || null,
        lastSyncedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return {
      success: false,
      code: isRetryableGoogleError(error) ? 'TRANSIENT_ERROR' : 'API_ERROR',
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get the external sync context required to cancel a Google event after local deletion.
 */
export async function getGoogleEventDeleteContext(
  eventId: string,
): Promise<GoogleEventDeleteContext | null> {
  const link = await prisma.externalEventLink.findUnique({
    where: { eventId },
    include: {
      externalAccount: {
        select: { revokedAt: true },
      },
    },
  });

  if (!link) {
    return null;
  }

  return {
    externalAccountId: link.externalAccountId,
    calendarId: link.calendarId,
    externalEventId: link.externalEventId,
    accountRevoked: !!link.externalAccount.revokedAt,
  };
}

/**
 * Cancel a Google Calendar event using a captured link context.
 * Safe to call after local event deletion.
 */
export async function cancelGoogleCalendarEvent(
  context: GoogleEventDeleteContext | null,
): Promise<GoogleSyncResult> {
  try {
    if (!context) {
      return { success: true, skipped: true, code: 'NOT_SYNCED' };
    }

    let syncError: string | undefined;
    let syncCode: GoogleSyncCode | undefined;
    let recovered = false;

    if (!context.accountRevoked) {
      try {
        // Get authenticated client
        const oauth2Client = await getAuthenticatedClient(context.externalAccountId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Delete event from Google
        await withRetry(() =>
          calendar.events.delete({
            calendarId: context.calendarId,
            eventId: context.externalEventId,
            sendUpdates: 'all',
          }),
        );
      } catch (error) {
        if (isGoogleNotFoundError(error)) {
          recovered = true;
        } else {
          syncCode = isRetryableGoogleError(error) ? 'TRANSIENT_ERROR' : 'API_ERROR';
          syncError =
            'Deleted in Duet, but failed to cancel the Google Calendar event';
        }
      }
    } else {
      recovered = true;
    }

    if (syncError) {
      return { success: false, code: syncCode, error: syncError };
    }
    return { success: true, recovered };
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return {
      success: false,
      code: isRetryableGoogleError(error) ? 'TRANSIENT_ERROR' : 'API_ERROR',
      error: getErrorMessage(error),
    };
  }
}

/**
 * Delete a Google Calendar event using event id (legacy wrapper).
 */
export async function deleteGoogleCalendarEvent(
  eventId: string
): Promise<GoogleSyncResult> {
  try {
    const context = await getGoogleEventDeleteContext(eventId);
    const result = await cancelGoogleCalendarEvent(context);
    await prisma.externalEventLink.delete({ where: { eventId } }).catch(() => undefined);
    return result;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return {
      success: false,
      code: isRetryableGoogleError(error) ? 'TRANSIENT_ERROR' : 'API_ERROR',
      error: getErrorMessage(error),
    };
  }
}

/**
 * Get sync status for an event
 */
export async function getEventSyncStatus(eventId: string): Promise<{
  synced: boolean;
  lastSyncedAt: Date | null;
  calendarId: string | null;
}> {
  const link = await prisma.externalEventLink.findUnique({
    where: { eventId },
  });

  return {
    synced: !!link,
    lastSyncedAt: link?.lastSyncedAt || null,
    calendarId: link?.calendarId || null,
  };
}
