import { NextResponse } from "next/server";
import { z } from "zod";

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

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    dateTimeStart: z.string().trim().optional().nullable(),
    dateTimeEnd: z.string().trim().optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let dateTimeStart: Date | undefined;
  if (parsed.data.dateTimeStart !== undefined) {
    const parsedDate = parseDate(parsed.data.dateTimeStart);
    if (!parsedDate) {
      return NextResponse.json(
        { error: "dateTimeStart must be a valid ISO date." },
        { status: 400 },
      );
    }
    dateTimeStart = parsedDate;
  }

  let dateTimeEnd: Date | undefined;
  if (parsed.data.dateTimeEnd !== undefined) {
    const parsedDate = parseDate(parsed.data.dateTimeEnd);
    if (!parsedDate) {
      return NextResponse.json(
        { error: "dateTimeEnd must be a valid ISO date." },
        { status: 400 },
      );
    }
    dateTimeEnd = parsedDate;
  }

  const event = await updateEvent(eventId, userId, {
    title: parsed.data.title?.trim(),
    description: parsed.data.description ?? undefined,
    dateTimeStart,
    dateTimeEnd,
    tags: parsed.data.tags !== undefined ? normalizeTags(parsed.data.tags) : undefined,
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
