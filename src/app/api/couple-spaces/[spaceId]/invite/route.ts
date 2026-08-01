import { NextResponse } from "next/server";

import { notFound, requireApiUserId } from "@/lib/api-utils";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { isDemoUser } from "@/lib/demo/guard";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

export async function GET(request: Request, { params }: PageProps) {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    return notFound();
  }

  // A working invite code would let a stranger join a sandbox that is about to
  // be deleted, so demo spaces never hand one out.
  if (await isDemoUser(userId)) {
    return NextResponse.json(
      { error: "Invites are disabled in the demo." },
      { status: 403 },
    );
  }

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/spaces/onboarding?invite=${encodeURIComponent(
    space.inviteCode,
  )}`;

  return NextResponse.json({ inviteCode: space.inviteCode, inviteUrl });
}
