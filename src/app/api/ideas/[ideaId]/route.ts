import { NextResponse } from "next/server";
import { z } from "zod";

import { notFound, parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { deleteIdea, getIdeaForUser, updateIdea } from "@/lib/ideas";
import { parseJsonOrForm } from "@/lib/request";
import { normalizeTags } from "@/lib/tags";

type PageProps = {
  params: Promise<{ ideaId: string }>;
};

export async function PUT(request: Request, { params }: PageProps) {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { ideaId } = await params;
  const existing = await getIdeaForUser(ideaId, userId);
  if (!existing) {
    return notFound();
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    status: z.enum(["NEW", "PLANNED", "DONE"]).optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  });
  const parsed = parseOrBadRequest(schema, body);
  if (!parsed.data) {
    return parsed.response;
  }

  const idea = await updateIdea(ideaId, userId, {
    title: parsed.data.title?.trim(),
    description: parsed.data.description ?? undefined,
    status: parsed.data.status ?? undefined,
    tags: parsed.data.tags !== undefined ? normalizeTags(parsed.data.tags) : undefined,
  });

  return NextResponse.json({ idea });
}

export async function DELETE(_request: Request, { params }: PageProps) {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { ideaId } = await params;
  const existing = await getIdeaForUser(ideaId, userId);
  if (!existing) {
    return notFound();
  }

  const idea = await deleteIdea(ideaId, userId);
  return NextResponse.json({ idea });
}
