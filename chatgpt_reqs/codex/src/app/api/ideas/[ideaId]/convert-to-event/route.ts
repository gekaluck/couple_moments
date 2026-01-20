import { NextResponse } from "next/server";

import { getIdeaForUser, updateIdea } from "@/lib/ideas";
import { createEventForSpace } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags, parseTags } from "@/lib/tags";

type Params = {
  params: { ideaId: string };
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

export async function POST(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const idea = await getIdeaForUser(params.ideaId, userId);
  if (!idea) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await parseJsonOrForm<{
    dateTimeStart?: string | null;
    dateTimeEnd?: string | null;
  }>(request);

  const dateTimeStart = parseDate(body.dateTimeStart);
  const dateTimeEnd = parseDate(body.dateTimeEnd);
  if (!dateTimeStart) {
    return NextResponse.json(
      { error: "dateTimeStart is required." },
      { status: 400 },
    );
  }

  if (body.dateTimeEnd !== undefined && !dateTimeEnd) {
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
