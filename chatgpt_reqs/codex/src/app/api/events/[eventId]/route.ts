import { NextResponse } from "next/server";

import { getEventForUser, updateEvent, deleteEvent } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
import { getSessionUserId } from "@/lib/session";
import { normalizeTags } from "@/lib/tags";

type PageProps = {
  params: Promise<{ eventId: string }>;
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

export async function GET(_request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PUT(request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { eventId } = await params;
  const existing = await getEventForUser(eventId, userId);
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

  let dateTimeStart: Date | undefined;
  if (body.dateTimeStart !== undefined) {
    const parsed = parseDate(body.dateTimeStart);
    if (!parsed) {
      return NextResponse.json(
        { error: "dateTimeStart must be a valid ISO date." },
        { status: 400 },
      );
    }
    dateTimeStart = parsed;
  }

  let dateTimeEnd: Date | undefined;
  if (body.dateTimeEnd !== undefined) {
    const parsed = parseDate(body.dateTimeEnd);
    if (!parsed) {
      return NextResponse.json(
        { error: "dateTimeEnd must be a valid ISO date." },
        { status: 400 },
      );
    }
    dateTimeEnd = parsed;
  }

  const event = await updateEvent(eventId, userId, {
    title: body.title?.trim(),
    description: body.description ?? undefined,
    dateTimeStart,
    dateTimeEnd,
    tags: body.tags !== undefined ? normalizeTags(body.tags) : undefined,
  });

  return NextResponse.json({ event });
}

export async function DELETE(_request: Request, { params }: PageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { eventId } = await params;
  const existing = await getEventForUser(eventId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const event = await deleteEvent(eventId, userId);
  return NextResponse.json({ event });
}
