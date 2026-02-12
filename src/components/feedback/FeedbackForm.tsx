"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type FeedbackFormProps = {
  fromPath: string;
  supportEmail: string;
  userId: string;
  spaceId: string | null;
};

export default function FeedbackForm({
  fromPath,
  supportEmail,
  userId,
  spaceId,
}: FeedbackFormProps) {
  const [summary, setSummary] = useState("");
  const [area, setArea] = useState("calendar");
  const [severity, setSeverity] = useState("medium");
  const [repro, setRepro] = useState("sometimes");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");

  const diagnostics = useMemo(() => {
    const now = new Date().toISOString();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const href = typeof window !== "undefined" ? window.location.href : "unknown";
    return { now, ua, href };
  }, []);

  const reportBody = useMemo(
    () =>
      [
        "# Duet Beta Issue Report",
        "",
        `Summary: ${summary || "(not provided)"}`,
        `Area: ${area}`,
        `Severity: ${severity}`,
        `Reproducibility: ${repro}`,
        "",
        "## Steps to Reproduce",
        steps || "(not provided)",
        "",
        "## Expected Result",
        expected || "(not provided)",
        "",
        "## Actual Result",
        actual || "(not provided)",
        "",
        "## Diagnostics",
        `User ID: ${userId}`,
        `Space ID: ${spaceId ?? "n/a"}`,
        `From path: ${fromPath}`,
        `Page URL: ${diagnostics.href}`,
        `Timestamp: ${diagnostics.now}`,
        `User agent: ${diagnostics.ua}`,
      ].join("\n"),
    [actual, area, diagnostics.href, diagnostics.now, diagnostics.ua, expected, fromPath, repro, severity, spaceId, steps, summary, userId],
  );

  const openEmailDraft = () => {
    if (!supportEmail) {
      toast.error("Support email is not configured. Copy the report and send it manually.");
      return;
    }
    const subject = encodeURIComponent(
      `[Duet Beta][${severity.toUpperCase()}] ${summary || "Issue report"}`,
    );
    const body = encodeURIComponent(reportBody);
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="surface p-6 md:p-8">
        <p className="section-kicker">Beta Feedback</p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
          Structured issue report
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Use this template so we can reproduce and fix issues quickly during beta.
        </p>
      </section>

      <section className="surface p-6 md:p-8">
        <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Summary
            </span>
            <input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              placeholder="Short description of the issue"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Area
              </span>
              <select
                value={area}
                onChange={(event) => setArea(event.target.value)}
                className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              >
                <option value="calendar">Calendar</option>
                <option value="planning">Planning</option>
                <option value="memories">Memories</option>
                <option value="notes">Notes</option>
                <option value="settings">Settings</option>
                <option value="google-sync">Google sync</option>
                <option value="auth">Auth / invite</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Severity
              </span>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="blocker">Blocker</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Reproducibility
              </span>
              <select
                value={repro}
                onChange={(event) => setRepro(event.target.value)}
                className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              >
                <option value="always">Always</option>
                <option value="sometimes">Sometimes</option>
                <option value="once">Only once</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Steps to reproduce
            </span>
            <textarea
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              className="min-h-[90px] rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              placeholder="1) Go to ... 2) Click ... 3) Observe ..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Expected result
              </span>
              <textarea
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
                className="min-h-[90px] rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Actual result
              </span>
              <textarea
                value={actual}
                onChange={(event) => setActual(event.target.value)}
                className="min-h-[90px] rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              />
            </label>
          </div>
        </form>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
          Generated report
        </p>
        <pre className="mt-2 max-h-[280px] overflow-auto rounded-xl border border-[var(--panel-border)] bg-white/80 p-3 text-xs text-[var(--text-secondary)]">
          {reportBody}
        </pre>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(reportBody);
              toast.success("Issue report copied to clipboard.");
            }}
            className="rounded-full bg-[var(--action-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--action-primary-strong)]"
          >
            Copy report
          </button>
          <button
            type="button"
            onClick={openEmailDraft}
            className="rounded-full border border-[var(--panel-border)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white"
          >
            Open email draft
          </button>
          <Link
            href={fromPath}
            className="rounded-full border border-[var(--panel-border)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-white hover:text-[var(--text-primary)]"
          >
            Back to app
          </Link>
        </div>
      </section>
    </div>
  );
}

