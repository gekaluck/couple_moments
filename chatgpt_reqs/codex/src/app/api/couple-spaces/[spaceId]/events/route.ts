import { NextResponse } from "next/server";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { createEventForSpace, listEventsForSpace } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

type PageProps = {
  params: Promise<{ spaceId: string }>;
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
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const timeframeParam = searchParams.get("timeframe");
  const timeframe =
    timeframeParam === "past" || timeframeParam === "upcoming"
      ? timeframeParam
      : null;

  const events = await listEventsForSpace({
    spaceId,
    from,
    to,
    timeframe,
  });

  return NextResponse.json({ events });
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

  const body = await parseJsonOrForm<{
    title?: string | null;
    description?: string | null;
    dateTimeStart?: string | null;
    dateTimeEnd?: string | null;
    tags?: unknown;
    linkedIdeaId?: string | null;
  }>(request);

  const title = body.title?.trim();
  const dateTimeStart = parseDate(body.dateTimeStart);
  const dateTimeEnd =
    body.dateTimeEnd !== undefined ? parseDate(body.dateTimeEnd) : null;

  if (!title || !dateTimeStart) {
    return NextResponse.json(
      { error: "Title and dateTimeStart are required." },
      { status: 400 },
    );
  }

  if (body.dateTimeEnd !== undefined && !dateTimeEnd) {
    return NextResponse.json(
      { error: "dateTimeEnd must be a valid ISO date." },
      { status: 400 },
    );
  }

  const event = await createEventForSpace(spaceId, userId, {
    title,
    description: body.description?.trim() || null,
    dateTimeStart,
    dateTimeEnd,
    tags: normalizeTags(body.tags),
    linkedIdeaId: body.linkedIdeaId?.trim() || null,
  });

  return NextResponse.json({ event }, { status: 201 });
}
