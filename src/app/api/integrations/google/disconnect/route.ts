import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';

/**
 * DELETE /api/integrations/google/disconnect
 * Disconnect Google Calendar integration
 */
export async function DELETE(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Delete external account (cascades to calendars, sync state, and availability blocks)
    await prisma.externalAccount.deleteMany({
      where: {
        userId: userId,
        provider: 'GOOGLE',
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
