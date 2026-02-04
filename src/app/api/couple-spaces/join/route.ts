import { NextResponse } from "next/server";
import { z } from "zod";

import { joinCoupleSpaceByInvite } from "@/lib/couple-spaces";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    inviteCode: z.string().trim().min(1),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invite code is required." },
      { status: 400 },
    );
  }

  const inviteCode = parsed.data.inviteCode;
  const result = await joinCoupleSpaceByInvite(inviteCode, userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ space: result.space });
}
