import { NextResponse } from "next/server";

import { getEventForUser, updateEvent, deleteEvent } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

type Params = {
  params: { eventId: string };
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

export async function GET(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const event = await getEventForUser(params.eventId, userId);
  if (!event) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PUT(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await getEventForUser(params.eventId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await parseJsonOrForm<{
    title?: string | null;
    description?: string | null;
    dateTimeStart?: string | null;
    dateTimeEnd?: string | null;
    tags?: unknown;
  }>(request);

  const dateTimeStart =
    body.dateTimeStart !== undefined ? parseDate(body.dateTimeStart) : undefined;
  if (body.dateTimeStart !== undefined && !dateTimeStart) {
    return NextResponse.json(
      { error: "dateTimeStart must be a valid ISO date." },
      { status: 400 },
    );
  }

  const dateTimeEnd =
    body.dateTimeEnd !== undefined ? parseDate(body.dateTimeEnd) : undefined;
  if (body.dateTimeEnd !== undefined && dateTimeEnd === null) {
    return NextResponse.json(
      { error: "dateTimeEnd must be a valid ISO date." },
      { status: 400 },
    );
  }

  const event = await updateEvent(params.eventId, userId, {
    title: body.title?.trim(),
    description: body.description ?? undefined,
    dateTimeStart,
    dateTimeEnd,
    tags: body.tags !== undefined ? normalizeTags(body.tags) : undefined,
  });

  return NextResponse.json({ event });
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await getEventForUser(params.eventId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const event = await deleteEvent(params.eventId, userId);
  return NextResponse.json({ event });
}
