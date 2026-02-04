import { NextResponse } from "next/server";
import { z } from "zod";

import { createCoupleSpaceForUser, listCoupleSpacesForUser } from "@/lib/couple-spaces";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const spaces = await listCoupleSpacesForUser(userId);
  return NextResponse.json({ spaces });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    name: z.string().trim().optional().nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = parsed.data.name?.trim() || null;
  const space = await createCoupleSpaceForUser(userId, name);
  return NextResponse.json({ space }, { status: 201 });
}
