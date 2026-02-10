'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Link2, Link2Off, RefreshCw } from 'lucide-react';

type Calendar = {
  id: string;
  calendarId: string;
  summary: string;
  primary: boolean;
  selected: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
};

type SyncState = {
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

type GoogleCalendarData = {
  account: {
    id: string;
    email: string;
    isRevoked: boolean;
  };
  calendars: Calendar[];
  syncState: SyncState | null;
} | null;

export default function GoogleCalendarSettings() {
  const router = useRouter();
  const [data, setData] = useState<GoogleCalendarData>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/integrations/google/calendars');
      if (res.status === 404) {
        // Not connected
        setData(null);
      } else if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to load Google Calendar settings');
      }
    } catch {
      setError('Failed to load Google Calendar settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    window.location.href = '/api/integrations/google/start';
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      const res = await fetch('/api/integrations/google/disconnect', {
        method: 'DELETE',
      });

      if (res.ok) {
        setData(null);
        router.refresh();
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to disconnect');
      }
    } catch {
      setError('Failed to disconnect Google Calendar');
    }
  }

  async function handleToggleCalendar(calendarId: string, selected: boolean) {
    try {
      const res = await fetch('/api/integrations/google/calendars/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId, selected }),
      });

      if (res.ok) {
        await loadData();
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to toggle calendar');
      }
    } catch {
      setError('Failed to toggle calendar');
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/integrations/google/sync', {
        method: 'POST',
      });

      if (res.ok) {
        await loadData();
      } else {
        const json = await res.json();
        setError(json.error || 'Failed to sync');
      }
    } catch {
      setError('Failed to sync availability');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <section className="surface border border-sky-200/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.9),rgba(233,245,255,0.8))] p-6 md:p-8">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface border border-sky-200/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.9),rgba(233,245,255,0.8))] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-50/90 text-sky-700 shadow-[var(--shadow-sm)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="section-kicker">Integrations</p>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Google Calendar
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Bring in real busy time so plans feel realistic for both of you.
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            data
              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
              : "border-slate-200 bg-white/85 text-slate-600"
          }`}
        >
          {data ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
          {data ? "Connected" : "Not connected"}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!data ? (
        <div className="mt-5 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
          <p className="text-sm text-[var(--text-secondary)]">
            Connect once, then choose exactly which calendars should contribute availability.
          </p>
          <button
            onClick={handleConnect}
            className="button-hover mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
          >
            <CalendarDays className="h-4 w-4" />
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[var(--shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Connected account
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {data.account.email}
              </p>
              {data.account.isRevoked && (
                <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                  Reconnect required
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[var(--shadow-sm)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Availability sync
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                    {data.syncState?.lastSyncedAt
                      ? new Date(data.syncState.lastSyncedAt).toLocaleString()
                      : 'Never synced'}
                  </p>
                  {data.syncState?.lastSyncError ? (
                    <p className="mt-1 text-xs text-red-600">
                      {data.syncState.lastSyncError}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync now'}
                </button>
              </div>
            </div>
          </div>

          {data.calendars.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Calendars included in sync
              </h4>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Toggle calendars that should contribute to unavailable blocks.
              </p>
              <div className="mt-3 space-y-2">
                {data.calendars.map((calendar) => (
                  <label
                    key={calendar.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/80 bg-white/80 p-3 shadow-[var(--shadow-sm)] transition hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={calendar.selected}
                      onChange={(e) =>
                        handleToggleCalendar(calendar.calendarId, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {calendar.summary}
                        </p>
                        {calendar.primary && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    {calendar.backgroundColor && (
                      <div
                        className="h-4 w-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: calendar.backgroundColor }}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="mt-5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Disconnect Google Calendar
          </button>
        </>
      )}
    </section>
  );
}
