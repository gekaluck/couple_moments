import { NextResponse } from "next/server";
import { z } from "zod";

import { internalServerError, notFound, requireApiUserId } from "@/lib/api-utils";
import { syncAvailabilityBlocks } from "@/lib/integrations/google/freebusy";
import { prisma } from "@/lib/prisma";
import { parseJsonOrForm } from "@/lib/request";

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
    const auth = await requireApiUserId();
    if (!auth.ok) {
      return auth.response;
    }
    const userId = auth.userId;
    
    const body = await parseJsonOrForm<Record<string, unknown>>(request);
    const parsed = toggleSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    
    const { calendarId, selected } = parsed.data;
    
    // Get external account
    const externalAccount = await prisma.externalAccount.findUnique({
      where: {
        userId_provider: {
          userId: userId,
          provider: "GOOGLE",
        },
      },
    });

    if (!externalAccount) {
      return notFound("Google Calendar not connected");
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
    console.error("Error toggling calendar:", error);
    return internalServerError("Failed to toggle calendar");
  }
}
