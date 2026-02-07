import { NextResponse } from "next/server";
import { z } from "zod";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { createEventForSpace, listEventsForSpace } from "@/lib/events";
import { createGoogleCalendarEvent } from "@/lib/integrations/google/events";
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

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional().nullable(),
    dateTimeStart: z.string().trim().min(1),
    dateTimeEnd: z.string().trim().optional().nullable(),
    tags: z.union([z.string(), z.array(z.string())]).optional().nullable(),
    linkedIdeaId: z.string().trim().optional().nullable(),
    addToGoogleCalendar: z.union([z.boolean(), z.string()]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Title and dateTimeStart are required." },
      { status: 400 },
    );
  }

  const title = parsed.data.title;
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

  const event = await createEventForSpace(spaceId, userId, {
    title,
    description: parsed.data.description?.trim() || null,
    dateTimeStart,
    dateTimeEnd,
    tags: normalizeTags(parsed.data.tags),
    linkedIdeaId: parsed.data.linkedIdeaId?.trim() || null,
  });

  // Sync to Google Calendar if requested
  const addToGoogle = parsed.data.addToGoogleCalendar === true || parsed.data.addToGoogleCalendar === "true";
  let googleCalendarSynced = false;

  if (addToGoogle) {
    const syncResult = await createGoogleCalendarEvent(userId, {
      id: event.id,
      title: event.title,
      description: event.description,
      dateTimeStart: event.dateTimeStart,
      dateTimeEnd: event.dateTimeEnd,
      timeIsSet: event.timeIsSet,
      placeName: event.placeName,
      placeAddress: event.placeAddress,
    });
    googleCalendarSynced = syncResult.success;
  }

  return NextResponse.json({ event, googleCalendarSynced }, { status: 201 });
}
