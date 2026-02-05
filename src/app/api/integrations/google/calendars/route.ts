import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/current-user';

/**
 * GET /api/integrations/google/calendars
 * Get list of calendars for the current user's Google account
 */
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get external account
    const externalAccount = await prisma.externalAccount.findUnique({
      where: {
        userId_provider: {
          userId: userId,
          provider: 'GOOGLE',
        },
      },
      include: {
        calendars: true,
        syncState: true,
      },
    });
    
    if (!externalAccount) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      account: {
        id: externalAccount.id,
        email: externalAccount.providerAccountId,
        isRevoked: !!externalAccount.revokedAt,
      },
      calendars: externalAccount.calendars.map((cal: any) => ({
        id: cal.id,
        calendarId: cal.calendarId,
        summary: cal.summary,
        primary: cal.primary,
        selected: cal.selected,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
      })),
      syncState: externalAccount.syncState ? {
        lastSyncedAt: externalAccount.syncState.lastSyncedAt,
        lastSyncError: externalAccount.syncState.lastSyncError,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}
