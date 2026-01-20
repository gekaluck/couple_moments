import { NextResponse } from "next/server";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { getSessionUserId } from "@/lib/session";

type Params = {
  params: { spaceId: string };
};

export async function GET(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const space = await getCoupleSpaceForUser(params.spaceId, userId);
  if (!space) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/spaces/onboarding?invite=${encodeURIComponent(
    space.inviteCode,
  )}`;

  return NextResponse.json({ inviteCode: space.inviteCode, inviteUrl });
}
