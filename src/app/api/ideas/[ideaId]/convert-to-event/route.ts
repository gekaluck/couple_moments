import { NextResponse } from "next/server";
import { z } from "zod";

import { getIdeaForUser, updateIdea } from "@/lib/ideas";
import { createEventForSpace } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags, parseTags } from "@/lib/tags";

type PageProps = {
  params: Promise<{ ideaId: string }>;
};

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export async function POST(request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { ideaId } = await params;
  const idea = await getIdeaForUser(ideaId, userId);
  if (!idea) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    dateTimeStart: z.string().trim().min(1),
    dateTimeEnd: z.string().trim().optional().nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "dateTimeStart is required." },
      { status: 400 },
    );
  }

  const dateTimeStart = parseDate(parsed.data.dateTimeStart);
  const dateTimeEnd =
    parsed.data.dateTimeEnd !== undefined
      ? parseDate(parsed.data.dateTimeEnd)
      : null;
  if (!dateTimeStart) {
    return NextResponse.json(
      { error: "dateTimeStart must be a valid ISO date." },
      { status: 400 },
    );
  }

  if (parsed.data.dateTimeEnd !== undefined && !dateTimeEnd) {
    return NextResponse.json(
      { error: "dateTimeEnd must be a valid ISO date." },
      { status: 400 },
    );
  }

  const event = await createEventForSpace(idea.coupleSpaceId, userId, {
    title: idea.title,
    description: idea.description,
    dateTimeStart,
    dateTimeEnd,
    tags: normalizeTags(parseTags(idea.tags)),
    linkedIdeaId: idea.id,
  });

  await updateIdea(idea.id, userId, {
    status: "PLANNED",
  });

  return NextResponse.json({ event });
}
