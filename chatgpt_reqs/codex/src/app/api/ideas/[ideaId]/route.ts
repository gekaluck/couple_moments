import { NextResponse } from "next/server";

import { deleteIdea, getIdeaForUser, updateIdea } from "@/lib/ideas";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

type Params = {
  params: { ideaId: string };
};

export async function PUT(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await getIdeaForUser(params.ideaId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await parseJsonOrForm<{
    title?: string | null;
    description?: string | null;
    status?: string | null;
    tags?: unknown;
  }>(request);

  const status =
    body.status === "NEW" || body.status === "PLANNED" || body.status === "DONE"
      ? body.status
      : undefined;

  const idea = await updateIdea(params.ideaId, userId, {
    title: body.title?.trim(),
    description: body.description ?? undefined,
    status,
    tags: body.tags !== undefined ? normalizeTags(body.tags) : undefined,
  });

  return NextResponse.json({ idea });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await getIdeaForUser(params.ideaId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const idea = await deleteIdea(params.ideaId, userId);
  return NextResponse.json({ idea });
}
