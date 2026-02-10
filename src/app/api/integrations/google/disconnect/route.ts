import { NextResponse } from "next/server";

import { internalServerError, requireApiUserId } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/integrations/google/disconnect
 * Disconnect Google Calendar integration
 */
export async function DELETE() {
  try {
    const auth = await requireApiUserId();
    if (!auth.ok) {
      return auth.response;
    }
    const userId = auth.userId;
    
    // Delete external account (cascades to calendars, sync state, and availability blocks)
    await prisma.externalAccount.deleteMany({
      where: {
        userId: userId,
        provider: "GOOGLE",
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Google Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return internalServerError("Failed to disconnect Google Calendar");
  }
}
