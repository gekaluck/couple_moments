import { NextResponse } from "next/server";

import { forbidden, internalServerError, notFound, requireApiUserId } from "@/lib/api-utils";
import { syncAvailabilityBlocks } from "@/lib/integrations/google/freebusy";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/integrations/google/sync
 * Manually trigger a sync of Google Calendar availability
 */
export async function POST() {
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
    });

    if (!externalAccount) {
      return notFound("Google Calendar not connected");
    }

    if (externalAccount.revokedAt) {
      return forbidden("Google Calendar access has been revoked. Please reconnect.");
    }
    
    // Perform sync
    const result = await syncAvailabilityBlocks(externalAccount.id);
    
    return NextResponse.json({
      success: true,
      blocksCount: result.blocksCount,
      syncedAt: result.syncedAt,
    });
  } catch (error) {
    console.error("Error syncing availability:", error);
    return internalServerError(
      "Failed to sync availability",
      error instanceof Error ? { message: error.message } : { message: "Unknown error" },
    );
  }
}
