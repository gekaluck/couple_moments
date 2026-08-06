export type GoogleEventDateTimeLike = {
  date?: string | null;
  dateTime?: string | null;
};

export type GoogleEventAttendeeLike = {
  email?: string | null;
  displayName?: string | null;
  responseStatus?: string | null;
};

export type GoogleEventLike = {
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start?: GoogleEventDateTimeLike | null;
  end?: GoogleEventDateTimeLike | null;
  attendees?: GoogleEventAttendeeLike[] | null;
};

export type GoogleEventPatch = {
  changed: boolean;
  notifyGuests: boolean;
  requestBody: GoogleEventLike;
};

function normalizedText(value: string | null | undefined) {
  return value || null;
}

function dateTimeMatches(
  existing: GoogleEventDateTimeLike | null | undefined,
  desired: GoogleEventDateTimeLike | null | undefined,
) {
  if (desired?.date) {
    return existing?.date === desired.date && !existing.dateTime;
  }

  if (desired?.dateTime) {
    if (!existing?.dateTime || existing.date) {
      return false;
    }
    const existingTime = Date.parse(existing.dateTime);
    const desiredTime = Date.parse(desired.dateTime);
    if (Number.isFinite(existingTime) && Number.isFinite(desiredTime)) {
      return existingTime === desiredTime;
    }
    return existing.dateTime === desired.dateTime;
  }

  return !existing?.date && !existing?.dateTime;
}

function normalizedEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function attendeeEmails(attendees: GoogleEventAttendeeLike[] | null | undefined) {
  return Array.from(
    new Set(
      (attendees ?? [])
        .map((attendee) => normalizedEmail(attendee.email))
        .filter((email): email is string => Boolean(email)),
    ),
  ).sort();
}

function sameStringArray(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

/**
 * Build the smallest Google Calendar patch needed for a Duet edit.
 *
 * Attendees are deliberately omitted when their email set is unchanged. That
 * leaves Google as the source of truth for RSVP state instead of replacing an
 * accepted attendee with a fresh attendee object on every edit.
 */
export function buildGoogleEventPatch(
  existing: GoogleEventLike,
  desired: GoogleEventLike,
): GoogleEventPatch {
  const requestBody: GoogleEventLike = {};
  let notifyGuests = false;

  if (normalizedText(existing.summary) !== normalizedText(desired.summary)) {
    requestBody.summary = desired.summary ?? null;
    notifyGuests = true;
  }

  if (
    normalizedText(existing.description) !== normalizedText(desired.description)
  ) {
    requestBody.description = desired.description ?? null;
  }

  if (normalizedText(existing.location) !== normalizedText(desired.location)) {
    requestBody.location = desired.location ?? null;
  }

  if (!dateTimeMatches(existing.start, desired.start)) {
    requestBody.start = desired.start ?? null;
    notifyGuests = true;
  }

  if (!dateTimeMatches(existing.end, desired.end)) {
    requestBody.end = desired.end ?? null;
    notifyGuests = true;
  }

  const existingEmails = attendeeEmails(existing.attendees);
  const desiredEmails = attendeeEmails(desired.attendees);
  if (!sameStringArray(existingEmails, desiredEmails)) {
    const existingByEmail = new Map(
      (existing.attendees ?? [])
        .map((attendee) => [normalizedEmail(attendee.email), attendee] as const)
        .filter(
          (entry): entry is [string, GoogleEventAttendeeLike] =>
            Boolean(entry[0]),
        ),
    );

    requestBody.attendees = (desired.attendees ?? []).map((attendee) => {
      const previous = existingByEmail.get(normalizedEmail(attendee.email) ?? "");
      return {
        email: attendee.email,
        displayName: attendee.displayName,
        ...(previous?.responseStatus
          ? { responseStatus: previous.responseStatus }
          : {}),
      };
    });
    notifyGuests = true;
  }

  return {
    changed: Object.keys(requestBody).length > 0,
    notifyGuests,
    requestBody,
  };
}
