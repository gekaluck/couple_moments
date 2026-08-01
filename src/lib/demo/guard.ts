import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/**
 * Demo guardrails.
 *
 * A demo user is an ordinary user with an ordinary session, so the whole product
 * works without any demo branching. Only actions with an effect *outside* the
 * sandbox need blocking: things that cost money, send mail, or hand out a
 * working invite code.
 */

export class DemoActionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoActionBlockedError";
  }
}

export async function isDemoUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isDemo: true },
  });
  return user?.isDemo ?? false;
}

export async function isDemoSession() {
  const userId = await getSessionUserId();
  if (!userId) {
    return false;
  }
  return isDemoUser(userId);
}

/**
 * Throws when the current session is a demo session. Callers should surface the
 * message rather than letting it become a 500 — every blocked action has a
 * disabled control in the UI, so this is a backstop, not the primary defence.
 */
export async function assertNotDemo(action: string) {
  if (await isDemoSession()) {
    throw new DemoActionBlockedError(`${action} is disabled in the demo.`);
  }
}

export async function isDemoSpace(spaceId: string) {
  const space = await prisma.coupleSpace.findUnique({
    where: { id: spaceId },
    select: { isDemo: true },
  });
  return space?.isDemo ?? false;
}
