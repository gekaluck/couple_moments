import { NextResponse } from "next/server";

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

  const body = await parseJsonOrForm<{ name?: string | null }>(request);
  const name = body.name?.trim() || null;
  const space = await createCoupleSpaceForUser(userId, name);
  return NextResponse.json({ space }, { status: 201 });
}
