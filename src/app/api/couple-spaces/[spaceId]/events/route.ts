import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, notFound, parseOrBadRequest, requireApiUserId } from "@/lib/api-utils";
import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { createEventForSpace, listEventsForSpace } from "@/lib/events";
import { createGoogleCalendarEvent } from "@/lib/integrations/google/events";
import { parseJsonOrForm } from "@/lib/request";
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
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    return notFound();
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
  const auth = await requireApiUserId();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.userId;

  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    return notFound();
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
  const parsed = parseOrBadRequest(schema, body, "Title and dateTimeStart are required.");
  if (!parsed.data) {
    return parsed.response;
  }

  const title = parsed.data.title;
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
  let googleSync:
    | {
        attempted: boolean;
        success: boolean;
        code?: string;
        error?: string;
      }
    | undefined;

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
    googleSync = {
      attempted: true,
      success: syncResult.success,
      code: syncResult.code,
      error: syncResult.success ? undefined : syncResult.error,
    };
  } else {
    googleSync = {
      attempted: false,
      success: true,
    };
  }

  return NextResponse.json({ event, googleCalendarSynced, googleSync }, { status: 201 });
}
