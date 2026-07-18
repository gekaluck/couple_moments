"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type GoogleCalendarAutoSyncProps = {
  connected: boolean;
  revoked: boolean;
  shouldAutoSync: boolean;
  lastSyncError: string | null;
  settingsHref: string;
};

export default function GoogleCalendarAutoSync({
  connected,
  revoked,
  shouldAutoSync,
  lastSyncError,
  settingsHref,
}: GoogleCalendarAutoSyncProps) {
  const router = useRouter();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (!shouldAutoSync || hasAttempted) {
      return;
    }

    const controller = new AbortController();

    async function sync() {
      setHasAttempted(true);
      try {
        await fetch("/api/integrations/google/sync", {
          method: "POST",
          signal: controller.signal,
        });
        router.refresh();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        router.refresh();
      }
    }

    void sync();
    return () => controller.abort();
  }, [router, shouldAutoSync, hasAttempted]);

  if (!connected || (!revoked && !lastSyncError)) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        {revoked
          ? "Google Calendar needs to be reconnected before busy events can appear."
          : "Google Calendar could not refresh. Your imported busy times may be out of date."}
      </p>
      <Link
        href={settingsHref}
        className="rounded-full border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-amber-100"
      >
        Open settings
      </Link>
    </div>
  );
}
