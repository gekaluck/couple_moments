import { NextResponse } from "next/server";
import { z } from "zod";

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

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    status: z.enum(["NEW", "PLANNED", "DONE"]).optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
