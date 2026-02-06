import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { listEventsForSpace } from "@/lib/events";
import { generateICalendar } from "@/lib/ical";

/**
 * Sanitize a string for safe use in HTTP headers
 * Removes control characters, quotes, and backslashes that could enable header injection
 */
function sanitizeForHeader(input: string): string {
  return input
    .replace(/[\r\n"\\]/g, "") // Remove CR, LF, quotes, backslashes
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> },
) {
  try {
    const userId = await requireUserId();
    const { spaceId } = await params;

    const space = await getCoupleSpaceForUser(spaceId, userId);
    if (!space) {
      return new Response("Forbidden", { status: 403 });
    }

    // Get all upcoming events
    const events = await listEventsForSpace({
      spaceId: space.id,
      timeframe: "upcoming",
    });

    // Sanitize space name to prevent header injection
    const rawName = space.name || "Duet";
    const safeName = sanitizeForHeader(rawName) || "couple-moments";
    
    const calendarName = safeName;
    const ical = generateICalendar(
      events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        dateTimeStart: event.dateTimeStart,
        dateTimeEnd: event.dateTimeEnd,
        timeIsSet: event.timeIsSet,
        placeName: event.placeName,
        placeAddress: event.placeAddress,
      })),
      calendarName,
    );

    const filename = `${calendarName.toLowerCase().replace(/\s+/g, "-")}-calendar.ics`;

    return new Response(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
