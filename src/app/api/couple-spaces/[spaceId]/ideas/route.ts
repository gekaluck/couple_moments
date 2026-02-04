import { NextResponse } from "next/server";
import { z } from "zod";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { createIdeaForSpace, listIdeasForSpace } from "@/lib/ideas";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

export async function GET(request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
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
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const title = parsed.data.title;
  const idea = await createIdeaForSpace(spaceId, userId, {
    title,
    description: parsed.data.description?.trim() || null,
    tags: normalizeTags(parsed.data.tags),
  });

  return NextResponse.json({ idea }, { status: 201 });
}
