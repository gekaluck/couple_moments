import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';
import { syncAvailabilityBlocks } from '@/lib/integrations/google/freebusy';

/**
 * POST /api/integrations/google/sync
 * Manually trigger a sync of Google Calendar availability
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
    
    if (externalAccount.revokedAt) {
      return NextResponse.json(
        { error: 'Google Calendar access has been revoked. Please reconnect.' },
        { status: 403 }
      );
    }
    
    // Perform sync
    const result = await syncAvailabilityBlocks(externalAccount.id);
    
    return NextResponse.json({
      success: true,
      blocksCount: result.blocksCount,
      syncedAt: result.syncedAt,
    });
  } catch (error) {
    console.error('Error syncing availability:', error);
    return NextResponse.json(
      { error: 'Failed to sync availability', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
