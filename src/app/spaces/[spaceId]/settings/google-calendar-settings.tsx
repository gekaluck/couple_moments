'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      <section className="surface p-6 md:p-8">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="section-kicker">Integrations</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Google Calendar Integration
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Connect your Google Calendar to sync your busy times automatically.
          </p>
        </div>

        {data ? (
          <button
            onClick={handleDisconnect}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="button-hover rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)]/35"
          >
            <svg
              className="mr-2 inline h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.5 3.5h-1V2h-2v1.5h-9V2h-2v1.5h-1C3.67 3.5 3 4.17 3 5v14c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zm0 15.5h-15V8.5h15V19z" />
            </svg>
            Connect Google Calendar
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Connected as
                </p>
                <p className="text-sm text-[var(--text-muted)]">{data.account.email}</p>
              </div>
              {data.account.isRevoked && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Reconnect Required
                </span>
              )}
            </div>

            {data.syncState && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Last synced</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {data.syncState.lastSyncedAt
                        ? new Date(data.syncState.lastSyncedAt).toLocaleString()
                        : 'Never'}
                    </p>
                    {data.syncState.lastSyncError && (
                      <p className="mt-1 text-xs text-red-600">
                        {data.syncState.lastSyncError}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {data.calendars.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Calendars
              </h4>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Select which calendars to sync busy times from
              </p>
              <div className="mt-3 space-y-2">
                {data.calendars.map((calendar) => (
                  <label
                    key={calendar.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--panel-border)] bg-white/80 p-3 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={calendar.selected}
                      onChange={(e) =>
                        handleToggleCalendar(calendar.calendarId, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
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
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: calendar.backgroundColor }}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
