import assert from "node:assert/strict";
import test from "node:test";

import { buildGoogleEventPatch } from "../../src/lib/integrations/google/event-diff";

const acceptedEvent = {
  summary: "Dinner",
  description: "Window table",
  location: "Luigi's, 1 Main St",
  start: { dateTime: "2026-08-08T00:00:00.000Z" },
  end: { dateTime: "2026-08-08T02:00:00.000Z" },
  attendees: [
    {
      email: "partner@example.com",
      displayName: "Partner",
      responseStatus: "accepted",
    },
  ],
};

test("local-only edits produce no Google mutation or guest notification", () => {
  const result = buildGoogleEventPatch(acceptedEvent, {
    ...acceptedEvent,
    attendees: [{ email: "partner@example.com", displayName: "New alias" }],
  });

  assert.deepEqual(result, {
    changed: false,
    notifyGuests: false,
    requestBody: {},
  });
});

test("description and location sync silently without replacing attendees", () => {
  const result = buildGoogleEventPatch(acceptedEvent, {
    ...acceptedEvent,
    description: "Patio table",
    location: "Luigi's, 2 Main St",
    attendees: [{ email: "partner@example.com", displayName: "Partner" }],
  });

  assert.equal(result.changed, true);
  assert.equal(result.notifyGuests, false);
  assert.deepEqual(result.requestBody, {
    description: "Patio table",
    location: "Luigi's, 2 Main St",
  });
});

test("time changes notify guests but preserve the existing attendee array", () => {
  const result = buildGoogleEventPatch(acceptedEvent, {
    ...acceptedEvent,
    start: { dateTime: "2026-08-08T01:00:00.000Z" },
    end: { dateTime: "2026-08-08T03:00:00.000Z" },
    attendees: [{ email: "partner@example.com", displayName: "Partner" }],
  });

  assert.equal(result.changed, true);
  assert.equal(result.notifyGuests, true);
  assert.deepEqual(result.requestBody, {
    start: { dateTime: "2026-08-08T01:00:00.000Z" },
    end: { dateTime: "2026-08-08T03:00:00.000Z" },
  });
});

test("membership changes carry forward an existing RSVP", () => {
  const result = buildGoogleEventPatch(acceptedEvent, {
    ...acceptedEvent,
    attendees: [
      { email: "partner@example.com", displayName: "Partner" },
      { email: "new@example.com", displayName: "New partner" },
    ],
  });

  assert.equal(result.changed, true);
  assert.equal(result.notifyGuests, true);
  assert.deepEqual(result.requestBody.attendees, [
    {
      email: "partner@example.com",
      displayName: "Partner",
      responseStatus: "accepted",
    },
    { email: "new@example.com", displayName: "New partner" },
  ]);
});

test("equivalent ISO offsets do not create time changes", () => {
  const result = buildGoogleEventPatch(
    {
      ...acceptedEvent,
      start: { dateTime: "2026-08-07T19:00:00-05:00" },
      end: { dateTime: "2026-08-07T21:00:00-05:00" },
    },
    acceptedEvent,
  );

  assert.equal(result.changed, false);
  assert.equal(result.notifyGuests, false);
});
