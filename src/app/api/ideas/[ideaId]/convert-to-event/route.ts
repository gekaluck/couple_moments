import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, notFound, parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { getIdeaForUser, updateIdea } from "@/lib/ideas";
import { createEventForSpace } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
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
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { ideaId } = await params;
  const idea = await getIdeaForUser(ideaId, userId);
  if (!idea) {
    return notFound();
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    dateTimeStart: z.string().trim().min(1),
    dateTimeEnd: z.string().trim().optional().nullable(),
  });
  const parsed = parseOrBadRequest(schema, body, "dateTimeStart is required.");
  if (!parsed.data) {
    return parsed.response;
  }

  const dateTimeStart = parseDate(parsed.data.dateTimeStart);
  const dateTimeEnd =
    parsed.data.dateTimeEnd !== undefined
      ? parseDate(parsed.data.dateTimeEnd)
      : null;
  if (!dateTimeStart) {
    return badRequest("dateTimeStart must be a valid ISO date.");
  }

  if (parsed.data.dateTimeEnd !== undefined && !dateTimeEnd) {
    return badRequest("dateTimeEnd must be a valid ISO date.");
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
