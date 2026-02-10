import { NextResponse } from "next/server";

import { internalServerError, notFound, requireApiUserId } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/integrations/google/calendars
 * Get list of calendars for the current user's Google account
 */
export async function GET() {
  try {
    const auth = await requireApiUserId();
    if (!auth.ok) {
      return auth.response;
    }
    const userId = auth.userId;
    
    // Get external account
    const externalAccount = await prisma.externalAccount.findUnique({
      where: {
        userId_provider: {
          userId: userId,
          provider: "GOOGLE",
        },
      },
      include: {
        calendars: true,
        syncState: true,
      },
    });
    
    if (!externalAccount) {
      return notFound("Google Calendar not connected");
    }
    
    return NextResponse.json({
      account: {
        id: externalAccount.id,
        email: externalAccount.providerAccountId,
        isRevoked: !!externalAccount.revokedAt,
      },
      calendars: externalAccount.calendars.map((cal) => ({
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
    console.error("Error fetching calendars:", error);
    return internalServerError("Failed to fetch calendars");
  }
}
