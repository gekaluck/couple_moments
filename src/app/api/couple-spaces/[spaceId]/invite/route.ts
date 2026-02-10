import { NextResponse } from "next/server";

import { notFound, requireApiUserId } from "@/lib/api-utils";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";

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

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/spaces/onboarding?invite=${encodeURIComponent(
    space.inviteCode,
  )}`;

  return NextResponse.json({ inviteCode: space.inviteCode, inviteUrl });
}
