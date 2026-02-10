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
): Promise<{ success: boolean; externalEventId?: string; error?: string }> {
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
      return { success: false, error: 'No Google account connected' };
    }

    // Check if already linked
    const existingLink = await prisma.externalEventLink.findUnique({
      where: { eventId: event.id },
    });

    if (existingLink) {
      return { success: false, error: 'Event already synced to Google Calendar' };
    }

    // Get primary calendar
    const calendarId = await getPrimaryCalendarId(account.id);
    if (!calendarId) {
      return { success: false, error: 'No primary calendar found' };
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
    const response = await calendar.events.insert({
      calendarId,
      sendUpdates: 'all',
      requestBody: googleEvent,
    });

    if (!response.data.id) {
      return { success: false, error: 'Failed to create Google Calendar event' };
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
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a Google Calendar event from a Duet event
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  event: DuetEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get existing link
    const link = await prisma.externalEventLink.findUnique({
      where: { eventId },
      include: { externalAccount: true },
    });

    if (!link) {
      return { success: false, error: 'Event not synced to Google Calendar' };
    }

    if (link.externalAccount.revokedAt) {
      return { success: false, error: 'Google account access revoked' };
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
    const response = await calendar.events.update({
      calendarId: link.calendarId,
      eventId: link.externalEventId,
      sendUpdates: 'all',
      requestBody: googleEvent,
    });

    // Update link
    await prisma.externalEventLink.update({
      where: { eventId },
      data: {
        etag: response.data.etag || null,
        lastSyncedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get existing link
    const link = await prisma.externalEventLink.findUnique({
      where: { eventId },
      include: { externalAccount: true },
    });

    if (!link) {
      return { success: true }; // Not synced, nothing to delete
    }

    if (!link.externalAccount.revokedAt) {
      try {
        // Get authenticated client
        const oauth2Client = await getAuthenticatedClient(link.externalAccountId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Delete event from Google
        await calendar.events.delete({
          calendarId: link.calendarId,
          eventId: link.externalEventId,
          sendUpdates: 'all',
        });
      } catch (error) {
        // Log but don't fail - event might already be deleted on Google side
        console.warn('Could not delete Google Calendar event:', error);
      }
    }

    // Remove the link
    await prisma.externalEventLink.delete({
      where: { eventId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
