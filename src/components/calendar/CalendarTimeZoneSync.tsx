"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type CalendarTimeZoneSyncProps = {
  serverTimeZone: string;
};

export default function CalendarTimeZoneSync({
  serverTimeZone,
}: CalendarTimeZoneSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || browserTimeZone === serverTimeZone) {
      return;
    }

    document.cookie = `cm_time_zone=${encodeURIComponent(browserTimeZone)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router, serverTimeZone]);

  return null;
}
