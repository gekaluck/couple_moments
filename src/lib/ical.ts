/**
 * iCal (.ics) generation for calendar export
 * See: https://icalendar.org/iCalendar-RFC-5545/
 */

type ICalEvent = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  dateTimeEnd: Date | null;
  timeIsSet: boolean;
  placeName: string | null;
  placeAddress: string | null;
};

function formatICalDate(date: Date, allDay: boolean): string {
  if (allDay) {
    // All-day events use YYYYMMDD format
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}${month}${day}`;
  }
  // Timed events use YYYYMMDDTHHMMSS format (local time)
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function escapeICalText(text: string): string {
  // Escape special characters in iCal text values
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // iCal lines must be max 75 characters, folded with CRLF + space
  const maxLength = 75;
  if (line.length <= maxLength) {
    return line;
  }
  const lines: string[] = [];
  let remaining = line;
  let isFirst = true;
  while (remaining.length > 0) {
    const chunkLength = isFirst ? maxLength : maxLength - 1;
    const chunk = remaining.slice(0, chunkLength);
    remaining = remaining.slice(chunkLength);
    lines.push(isFirst ? chunk : ` ${chunk}`);
    isFirst = false;
  }
  return lines.join("\r\n");
}

export function generateICalendar(
  events: ICalEvent[],
  calendarName: string,
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Duet//EN",
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const allDay = !event.timeIsSet;
    const dtStart = formatICalDate(event.dateTimeStart, allDay);
    const dtEnd = event.dateTimeEnd
      ? formatICalDate(event.dateTimeEnd, allDay)
      : formatICalDate(
          new Date(event.dateTimeStart.getTime() + 2 * 60 * 60 * 1000), // Default 2 hours
          allDay,
        );

    const location = [event.placeName, event.placeAddress]
      .filter(Boolean)
      .join(", ");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@couplemoments.app`);
    lines.push(`DTSTAMP:${formatICalDate(new Date(), false)}`);

    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    }

    lines.push(foldLine(`SUMMARY:${escapeICalText(event.title)}`));

    if (event.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`));
    }

    if (location) {
      lines.push(foldLine(`LOCATION:${escapeICalText(location)}`));
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // iCal uses CRLF line endings
  return lines.join("\r\n");
}
