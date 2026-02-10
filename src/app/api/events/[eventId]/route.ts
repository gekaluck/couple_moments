import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, notFound, parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { getEventForUser, updateEvent, deleteEvent } from "@/lib/events";
import { parseJsonOrForm } from "@/lib/request";
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
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) {
    return notFound();
  }

  return NextResponse.json({ event });
}

export async function PUT(request: Request, { params }: PageProps) {
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { eventId } = await params;
  const existing = await getEventForUser(eventId, userId);
  if (!existing) {
    return notFound();
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1).optional().nullable(),
    description: z.string().trim().optional().nullable(),
    dateTimeStart: z.string().trim().optional().nullable(),
    dateTimeEnd: z.string().trim().optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  });
  const parsed = parseOrBadRequest(schema, body);
  if (!parsed.data) {
    return parsed.response;
  }

  let dateTimeStart: Date | undefined;
  if (parsed.data.dateTimeStart !== undefined) {
    const parsedDate = parseDate(parsed.data.dateTimeStart);
    if (!parsedDate) {
      return badRequest("dateTimeStart must be a valid ISO date.");
    }
    dateTimeStart = parsedDate;
  }

  let dateTimeEnd: Date | undefined;
  if (parsed.data.dateTimeEnd !== undefined) {
    const parsedDate = parseDate(parsed.data.dateTimeEnd);
    if (!parsedDate) {
      return badRequest("dateTimeEnd must be a valid ISO date.");
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
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { eventId } = await params;
  const existing = await getEventForUser(eventId, userId);
  if (!existing) {
    return notFound();
  }

  const event = await deleteEvent(eventId, userId);
  return NextResponse.json({ event });
}
