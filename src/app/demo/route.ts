import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deleteExpiredDemoSpaces } from "@/lib/demo/cleanup";
import { demoMaxLiveSpaces, isDemoModeEnabled } from "@/lib/demo/config";
import { countLiveDemoSpaces, provisionDemoSpace } from "@/lib/demo/provision";
import {
  consumeDemoProvisionAllowance,
  getClientIp,
} from "@/lib/demo/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  verifySession,
} from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Demo entry point.
 *
 * Provisions a throwaway space, signs the visitor into it, and redirects. Three
 * independent bounds keep a publicly shared link from growing the database
 * without limit: cookie reuse, a per-IP rate limit, and a global cap on live
 * sandboxes.
 */
export async function GET(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const now = new Date();

  // 1. Reuse. A refresh, or re-opening the same link, costs nothing.
  const existingSpaceId = await findLiveDemoSpaceForRequest(request, now);
  if (existingSpaceId) {
    return NextResponse.redirect(spaceUrl(request, existingSpaceId), 303);
  }

  // 2. Per-IP limit.
  const allowance = consumeDemoProvisionAllowance(getClientIp(request));
  if (!allowance.allowed) {
    return busyResponse(
      "You've opened a few demos already.",
      allowance.retryAfterSeconds,
    );
  }

  // Opportunistic cleanup, so expired sandboxes still get collected even if the
  // cron job is never wired up in a given environment.
  try {
    await deleteExpiredDemoSpaces(now, 5);
  } catch (error) {
    console.error("Demo cleanup failed during provisioning", error);
  }

  // 3. Global cap.
  if ((await countLiveDemoSpaces(now)) >= demoMaxLiveSpaces()) {
    return busyResponse("The demo is busy right now.", 600);
  }

  const { spaceId, sessionToken } = await provisionDemoSpace(now);

  const response = NextResponse.redirect(spaceUrl(request, spaceId), 303);
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return response;
}

function spaceUrl(request: NextRequest, spaceId: string) {
  return new URL(`/spaces/${spaceId}/calendar`, request.url);
}

async function findLiveDemoSpaceForRequest(request: NextRequest, now: Date) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const userId = await verifySession(token);
  if (!userId) {
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      user: { isDemo: true },
      coupleSpace: {
        isDemo: true,
        demoExpiresAt: { gt: now },
      },
    },
    select: { coupleSpaceId: true },
  });

  return membership?.coupleSpaceId ?? null;
}

function busyResponse(reason: string, retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.round(retryAfterSeconds / 60));
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Duet demo</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
             font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
             background: #fff7f5; color: #2d2520; padding: 24px; }
      .card { max-width: 420px; text-align: center; }
      h1 { font-size: 1.35rem; margin: 0 0 12px; }
      p { margin: 0 0 20px; line-height: 1.6; color: #6b5f58; }
      a { display: inline-block; padding: 12px 24px; border-radius: 999px;
          background: #b83a48; color: #fff; text-decoration: none; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${reason}</h1>
      <p>Try again in about ${minutes} minute${minutes === 1 ? "" : "s"} — or create your own space, it takes under two minutes.</p>
      <a href="/register">Create your space</a>
    </div>
  </body>
</html>`;

  return new NextResponse(body, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "retry-after": String(retryAfterSeconds),
    },
  });
}
