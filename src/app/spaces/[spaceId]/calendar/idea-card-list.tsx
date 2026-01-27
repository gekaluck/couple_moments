"use client";

import { useState } from "react";
import Link from "next/link";

import TagBadge from "@/components/ui/TagBadge";

type IdeaCardListProps = {
  spaceId: string;
  ideas: Array<{
    id: string;
    title: string;
    description: string | null;
    tags: string;
  }>;
  commentCounts: Record<string, number>;
  onSchedule: (formData: FormData) => Promise<void>;
};

function parseTags(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function IdeaCardList({
  spaceId,
  ideas,
  commentCounts,
  onSchedule,
}: IdeaCardListProps) {
  const [openIdeaId, setOpenIdeaId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {ideas.map((idea) => {
        const tags = parseTags(idea.tags);
        const isOpen = openIdeaId === idea.id;

        return (
          <div
            key={idea.id}
            className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-[var(--text-primary)]">
                  {idea.title}
                </h4>
                {idea.description ? (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {idea.description}
                  </p>
                ) : null}
                {tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag: string) => (
                      <TagBadge key={tag} label={tag} />
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {commentCounts[idea.id] ? (
                  <Link
                    className="pill-button"
                    href={`/spaces/${spaceId}/ideas/${idea.id}#idea-comments`}
                  >
                    Comments ({commentCounts[idea.id]})
                  </Link>
                ) : null}
                <button
                  className="rounded-full border border-[var(--border-medium)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)]"
                  onClick={() => setOpenIdeaId(isOpen ? null : idea.id)}
                  type="button"
                >
                  Schedule
                </button>
              </div>
            </div>
            {isOpen ? (
              <form
                className="mt-3 grid gap-2 md:grid-cols-[1.2fr_1fr_auto]"
                action={onSchedule}
              >
                <input type="hidden" name="ideaId" value={idea.id} />
                <input
                  className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  name="date"
                  type="date"
                  required
                />
                <input
                  className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  name="time"
                  type="time"
                />
                <button
                  className="rounded-full bg-[var(--accent-strong)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent)]"
                  type="submit"
                >
                  Create event
                </button>
              </form>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
