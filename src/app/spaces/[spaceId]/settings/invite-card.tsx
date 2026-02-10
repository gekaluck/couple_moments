"use client";

import { useState } from "react";
import { toast } from "sonner";

type InviteCardProps = {
  inviteCode: string;
};

const CopyIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
);

export default function InviteCard({ inviteCode }: InviteCardProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/spaces/onboarding?invite=${inviteCode}`
      : `/spaces/onboarding?invite=${inviteCode}`;

  const copyToClipboard = async (text: string, type: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === "link" ? "Link copied!" : "Code copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my space on Duet",
          text: "I'm inviting you to join our Duet space!",
          url: inviteUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyToClipboard(inviteUrl, "link");
    }
  };

  return (
    <section className="surface border-2 border-dashed border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Invite your partner
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Share this link with your partner so they can join your space.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Invite Link */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Invite Link
          </label>
          <div className="flex gap-2">
            <div className="flex-1 truncate rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)]">
              {inviteUrl}
            </div>
            <button
              onClick={() => copyToClipboard(inviteUrl, "link")}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                copied === "link"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {copied === "link" ? <CheckIcon /> : <CopyIcon />}
              {copied === "link" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Invite Code */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Invite Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl border border-[var(--panel-border)] bg-white px-4 py-3 font-mono text-lg font-bold tracking-widest text-[var(--text-primary)]">
              {inviteCode}
            </div>
            <button
              onClick={() => copyToClipboard(inviteCode, "code")}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                copied === "code"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {copied === "code" ? <CheckIcon /> : <CopyIcon />}
              {copied === "code" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:shadow-xl hover:shadow-rose-500/30"
        >
          <ShareIcon />
          Share with partner
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
        Your partner will need to create an account and enter this code to join.
      </p>
    </section>
  );
}
