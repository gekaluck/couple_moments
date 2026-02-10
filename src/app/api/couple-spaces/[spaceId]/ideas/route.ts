import { NextResponse } from "next/server";
import { z } from "zod";

import { notFound, parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { createIdeaForSpace, listIdeasForSpace } from "@/lib/ideas";
import { parseJsonOrForm } from "@/lib/request";
import { normalizeTags } from "@/lib/tags";

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const ideas = await listIdeasForSpace({
    spaceId,
    status:
      status === "NEW" || status === "PLANNED" || status === "DONE"
        ? status
        : null,
  });

  return NextResponse.json({ ideas });
}

export async function POST(request: Request, { params }: PageProps) {
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

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  });
  const parsed = parseOrBadRequest(schema, body, "Title is required.");
  if (!parsed.data) {
    return parsed.response;
  }

  const title = parsed.data.title;
  const idea = await createIdeaForSpace(spaceId, userId, {
    title,
    description: parsed.data.description?.trim() || null,
    tags: normalizeTags(parsed.data.tags),
  });

  return NextResponse.json({ idea }, { status: 201 });
}
