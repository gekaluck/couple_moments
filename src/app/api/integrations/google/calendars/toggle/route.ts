import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';
import { parseJsonOrForm } from '@/lib/request';
import { syncAvailabilityBlocks } from '@/lib/integrations/google/freebusy';

const toggleSchema = z.object({
  calendarId: z.string(),
  selected: z.boolean(),
});

/**
 * POST /api/integrations/google/calendars/toggle
 * Toggle calendar selection
 */
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await parseJsonOrForm<Record<string, unknown>>(request);
    const parsed = toggleSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    
    const { calendarId, selected } = parsed.data;
    
    // Get external account
    const externalAccount = await prisma.externalAccount.findUnique({
      where: {
        userId_provider: {
          userId: userId,
          provider: 'GOOGLE',
        },
      },
    });
    
    if (!externalAccount) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 404 }
      );
    }
    
    // Update calendar selection
    const calendar = await prisma.externalCalendar.update({
      where: {
        externalAccountId_calendarId: {
          externalAccountId: externalAccount.id,
          calendarId,
        },
      },
      data: {
        selected,
      },
    });
    
    // Re-sync availability after toggling
    await syncAvailabilityBlocks(externalAccount.id);
    
    return NextResponse.json({
      success: true,
      calendar: {
        id: calendar.id,
        calendarId: calendar.calendarId,
        summary: calendar.summary,
        selected: calendar.selected,
      },
    });
  } catch (error) {
    console.error('Error toggling calendar:', error);
    return NextResponse.json(
      { error: 'Failed to toggle calendar' },
      { status: 500 }
    );
  }
}
