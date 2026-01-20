import { NextResponse } from "next/server";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { createIdeaForSpace, listIdeasForSpace } from "@/lib/ideas";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const ideas = await listIdeasForSpace({
    spaceId: params.spaceId,
    status:
      status === "NEW" || status === "PLANNED" || status === "DONE"
        ? status
        : null,
  });

  return NextResponse.json({ ideas });
}

export async function POST(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const space = await getCoupleSpaceForUser(params.spaceId, userId);
  if (!space) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await parseJsonOrForm<{
    title?: string | null;
    description?: string | null;
    tags?: unknown;
  }>(request);

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const idea = await createIdeaForSpace(params.spaceId, userId, {
    title,
    description: body.description?.trim() || null,
    tags: normalizeTags(body.tags),
  });

  return NextResponse.json({ idea }, { status: 201 });
}
