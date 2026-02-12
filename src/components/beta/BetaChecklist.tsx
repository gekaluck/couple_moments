"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

const CHECKLIST_VERSION = "v1";

type ChecklistItem = {
  id: string;
  label: string;
  hint: string;
};

const ITEMS: ChecklistItem[] = [
  {
    id: "invite-partner",
    label: "Invite your partner and confirm both members appear",
    hint: "Settings -> Members",
  },
  {
    id: "create-event",
    label: "Create one event from Calendar",
    hint: "Calendar -> + Event",
  },
  {
    id: "create-unavailable",
    label: "Create one unavailable block",
    hint: "Calendar -> Block time",
  },
  {
    id: "idea-to-event",
    label: "Create one idea and schedule it",
    hint: "What's ahead -> New idea -> Schedule",
  },
  {
    id: "notes-context",
    label: "Add one note linked to planning context",
    hint: "Notes tab",
  },
  {
    id: "memory-rating",
    label: "Open a memory and leave a date rating",
    hint: "Memories tab",
  },
  {
    id: "google-connect",
    label: "Connect Google Calendar (optional for beta)",
    hint: "Settings -> Google Calendar",
  },
];

type BetaChecklistProps = {
  spaceId: string;
};

export default function BetaChecklist({ spaceId }: BetaChecklistProps) {
  const storageKey = `duet_beta_checklist_${CHECKLIST_VERSION}_${spaceId}`;
  const [state, setState] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      window.localStorage.removeItem(storageKey);
      return {};
    }
  });

  const completedCount = useMemo(
    () => ITEMS.filter((item) => Boolean(state[item.id])).length,
    [state],
  );
  const percent = Math.round((completedCount / ITEMS.length) * 100);

  return (
    <div id="beta-checklist" className="rounded-2xl border border-violet-100/90 bg-white/80 p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Beta Tester Checklist</p>
          <p className="text-xs text-[var(--text-muted)]">
            Track high-signal flows before wider release.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {completedCount}/{ITEMS.length} done
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {ITEMS.map((item) => {
          const checked = Boolean(state[item.id]);
          return (
            <li key={item.id} className="rounded-xl border border-violet-100/80 bg-violet-50/60 px-3 py-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-violet-300 accent-violet-600"
                  checked={checked}
                  onChange={(event) =>
                    setState((prev) => {
                      const next = { ...prev, [item.id]: event.target.checked };
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(storageKey, JSON.stringify(next));
                      }
                      return next;
                    })
                  }
                />
                <span>
                  <span className="block text-sm text-[var(--text-primary)]">{item.label}</span>
                  <span className="block text-xs text-[var(--text-muted)]">{item.hint}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setState({});
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(storageKey);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset checklist
        </button>
      </div>
    </div>
  );
}
