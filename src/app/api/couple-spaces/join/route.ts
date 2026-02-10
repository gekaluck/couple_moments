import { NextResponse } from "next/server";
import { z } from "zod";

import { conflict, parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { joinCoupleSpaceByInvite } from "@/lib/couple-spaces";
import { parseJsonOrForm } from "@/lib/request";

export async function POST(request: Request) {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    inviteCode: z.string().trim().min(1),
  });
  const parsed = parseOrBadRequest(schema, body, "Invite code is required.");
  if (!parsed.data) {
    return parsed.response;
  }

  const inviteCode = parsed.data.inviteCode;
  const result = await joinCoupleSpaceByInvite(inviteCode, userId);
  if (result.error) {
    return conflict(result.error);
  }

  return NextResponse.json({ space: result.space });
}
