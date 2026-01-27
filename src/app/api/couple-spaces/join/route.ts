import { NextResponse } from "next/server";

import { joinCoupleSpaceByInvite } from "@/lib/couple-spaces";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await parseJsonOrForm<{ inviteCode?: string | null }>(request);
  const inviteCode = body.inviteCode?.trim();
  if (!inviteCode) {
    return NextResponse.json(
      { error: "Invite code is required." },
      { status: 400 },
    );
  }

  const result = await joinCoupleSpaceByInvite(inviteCode, userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ space: result.space });
}
