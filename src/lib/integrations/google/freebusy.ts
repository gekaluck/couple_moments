import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedClient } from './calendar';

/**
 * Fetch freebusy information for selected calendars
 * @param externalAccountId The external account ID
 * @param timeMin Start of the time range (default: now)
 * @param timeMax End of the time range (default: 90 days from now)
 */
export async function fetchFreeBusy(
  externalAccountId: string,
  timeMin?: Date,
  timeMax?: Date
) {
  const oauth2Client = await getAuthenticatedClient(externalAccountId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Get selected calendars
  const selectedCalendars = await prisma.externalCalendar.findMany({
    where: {
      externalAccountId,
      selected: true,
    },
  });
  
  if (selectedCalendars.length === 0) {
    return [];
  }
  
  const now = new Date();
  const start = timeMin || now;
  const end = timeMax || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  
  // Query freebusy for all selected calendars
  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: selectedCalendars.map((cal) => ({ id: cal.calendarId })),
    },
  });
  
  const busyBlocks: Array<{
    calendarId: string;
    startAt: Date;
    endAt: Date;
  }> = [];
  
  // Parse busy blocks from response
  if (data.calendars) {
    for (const [calendarId, calData] of Object.entries(data.calendars)) {
      if (calData.busy) {
        for (const busy of calData.busy) {
          if (busy.start && busy.end) {
            busyBlocks.push({
              calendarId,
              startAt: new Date(busy.start),
              endAt: new Date(busy.end),
            });
          }
        }
      }
    }
  }
  
  return busyBlocks;
}

/**
 * Sync freebusy data to ExternalAvailabilityBlock table
 */
export async function syncAvailabilityBlocks(
  externalAccountId: string,
  timeMin?: Date,
  timeMax?: Date
) {
  const account = await prisma.externalAccount.findUnique({
    where: { id: externalAccountId },
    include: { user: true },
  });
  
  if (!account) {
    throw new Error('External account not found');
  }
  
  try {
    const busyBlocks = await fetchFreeBusy(externalAccountId, timeMin, timeMax);
    
    const now = new Date();
    const start = timeMin || now;
    const end = timeMax || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    // Use transaction to ensure atomicity - if createMany fails, deleteMany is rolled back
    await prisma.$transaction(async (tx) => {
      // Delete existing blocks in the sync window
      await tx.externalAvailabilityBlock.deleteMany({
        where: {
          externalAccountId,
          startAt: { gte: start },
          endAt: { lte: end },
        },
      });

      // Create new blocks
      if (busyBlocks.length > 0) {
        await tx.externalAvailabilityBlock.createMany({
          data: busyBlocks.map((block) => ({
            userId: account.userId,
            externalAccountId,
            calendarId: block.calendarId,
            startAt: block.startAt,
            endAt: block.endAt,
            source: 'GOOGLE',
          })),
        });
      }
    });
    
    // Update sync state
    await prisma.externalSyncState.upsert({
      where: { externalAccountId },
      create: {
        externalAccountId,
        lastSyncedAt: new Date(),
        lastSyncError: null,
      },
      update: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
      },
    });
    
    return {
      success: true,
      blocksCount: busyBlocks.length,
      syncedAt: new Date(),
    };
  } catch (error) {
    // Log error in sync state
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await prisma.externalSyncState.upsert({
      where: { externalAccountId },
      create: {
        externalAccountId,
        lastSyncError: errorMessage,
      },
      update: {
        lastSyncError: errorMessage,
      },
    });
    
    throw error;
  }
}

/**
 * Get availability blocks for a user (including external blocks)
 */
export async function getUserAvailabilityBlocks(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // Get manual availability blocks
  const manualBlocks = await prisma.availabilityBlock.findMany({
    where: {
      createdByUserId: userId,
      startAt: { lte: endDate },
      endAt: { gte: startDate },
    },
  });
  
  // Get external availability blocks
  const externalBlocks = await prisma.externalAvailabilityBlock.findMany({
    where: {
      userId,
      startAt: { lte: endDate },
      endAt: { gte: startDate },
    },
    include: {
      externalAccount: {
        include: {
          calendars: {
            where: {
              selected: true,
            },
          },
        },
      },
    },
  });
  
  return {
    manual: manualBlocks,
    external: externalBlocks,
  };
}
