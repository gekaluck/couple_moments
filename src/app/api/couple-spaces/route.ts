import { NextResponse } from "next/server";
import { z } from "zod";

import { parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { createCoupleSpaceForUser, listCoupleSpacesForUser } from "@/lib/couple-spaces";
import { parseJsonOrForm } from "@/lib/request";

export async function GET() {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const spaces = await listCoupleSpacesForUser(userId);
  return NextResponse.json({ spaces });
}

export async function POST(request: Request) {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    name: z.string().trim().optional().nullable(),
  });
  const parsed = parseOrBadRequest(schema, body);
  if (!parsed.data) {
    return parsed.response;
  }

  const name = parsed.data.name?.trim() || null;
  const space = await createCoupleSpaceForUser(userId, name);
  return NextResponse.json({ space }, { status: 201 });
}
