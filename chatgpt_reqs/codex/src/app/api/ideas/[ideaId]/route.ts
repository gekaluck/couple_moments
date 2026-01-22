import { NextResponse } from "next/server";

import { deleteIdea, getIdeaForUser, updateIdea } from "@/lib/ideas";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

type PageProps = {
  params: Promise<{ ideaId: string }>;
};

export async function PUT(request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { ideaId } = await params;
  const existing = await getIdeaForUser(ideaId, userId);
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

  const idea = await updateIdea(ideaId, userId, {
    title: body.title?.trim(),
    description: body.description ?? undefined,
    status,
    tags: body.tags !== undefined ? normalizeTags(body.tags) : undefined,
  });

  return NextResponse.json({ idea });
}

export async function DELETE(_request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { ideaId } = await params;
  const existing = await getIdeaForUser(ideaId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const idea = await deleteIdea(ideaId, userId);
  return NextResponse.json({ idea });
}
