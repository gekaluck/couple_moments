import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deleteExpiredDemoSpaces } from "@/lib/demo/cleanup";
import { isDemoModeEnabled } from "@/lib/demo/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled sweep of expired demo sandboxes. Wired to an hourly cron in
 * `vercel.json`; `/demo` also cleans opportunistically, so this is the tidy
 * path rather than the only path.
 */
export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await deleteExpiredDemoSpaces();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Demo cleanup failed", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

// Vercel Cron issues GET requests; accept both so the schedule and manual
// invocation share one implementation.
export const GET = POST;
