"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import Modal from "@/components/Modal";

import IconButton from "@/components/ui/IconButton";
import TagBadge from "@/components/ui/TagBadge";
import { formatTimeAgo, getInitials } from "@/lib/formatters";

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.5" />
    <path d="M8 3v4M16 3v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M8 6V4h8v2M6 6l1 14h10l1-14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v6M14 11v6" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

type PlanningIdeaListProps = {
  spaceId: string;
  ideas: Array<{
    id: string;
    title: string;
    description: string | null;
    tags: string;
    createdAt: Date;
    createdBy: { name: string | null; email: string };
  }>;
  currentUserId: string;
  commentsByIdea: Record<
    string,
    Array<{
      id: string;
      body: string;
      createdAt: string;
      author: { id: string; name: string | null; email: string };
    }>
  >;
  commentCounts: Record<string, number>;
  onSchedule: (formData: FormData) => Promise<void>;
  onAddComment: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
  onMarkDone?: (formData: FormData) => Promise<void>;
};

function parseTags(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const AVATAR_GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
];

function getAvatarGradient(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) % 997;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

type IdeaComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

type IdeaCommentsProps = {
  ideaId: string;
  comments: IdeaComment[];
  isOpen: boolean;
  currentUserId: string;
  onAddComment: (formData: FormData) => Promise<void>;
};

function IdeaComments({
  ideaId,
  comments,
  isOpen,
  currentUserId,
  onAddComment,
}: IdeaCommentsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mt-4 animate-slide-down rounded-lg bg-gray-50 p-4">
      <div className="flex flex-col">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No comments yet.
          </p>
        ) : null}
        {comments.map((comment) => {
          const isCurrentUser = comment.author.id === currentUserId;
          const avatarGradient = isCurrentUser
            ? "from-sky-500 to-indigo-600"
            : "from-rose-500 to-pink-600";
          return (
            <div
              key={comment.id}
              className="flex items-start gap-3 border-b border-gray-200 py-2 last:border-b-0"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${avatarGradient}`}
              >
                {getInitials(comment.author.name, comment.author.email)}
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--text-tertiary)]">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {comment.author.name || comment.author.email}
                  </span>
                  <span className="mx-2">•</span>
                  {formatTimeAgo(comment.createdAt)}
                </p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {comment.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form
        ref={formRef}
        className="mt-3 flex flex-wrap gap-2"
        action={onAddComment}
      >
        <input type="hidden" name="ideaId" value={ideaId} />
        <input
          ref={inputRef}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
          name="content"
          placeholder="Add comment..."
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
          type="submit"
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default function PlanningIdeaList({
  spaceId,
  ideas,
  currentUserId,
  commentsByIdea,
  commentCounts,
  onSchedule,
  onAddComment,
  onDelete,
  onMarkDone,
}: PlanningIdeaListProps) {
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(5);
  const activeIdea = useMemo(
    () => ideas.find((idea) => idea.id === activeIdeaId) ?? null,
    [activeIdeaId, ideas],
  );
  const visibleIdeas = ideas.slice(0, visibleCount);
  const hasMore = ideas.length > visibleCount;

  const toggleComments = (ideaId: string) => {
    setOpenComments((prev) => ({ ...prev, [ideaId]: !prev[ideaId] }));
  };

  return (
    <section className="surface p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
        New ideas
      </h2>
      <div className="mt-4 flex flex-col gap-3 stagger-children">
        {ideas.length === 0 ? (
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[var(--shadow-sm)]">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 6v12M6 12h12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  No new ideas yet
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Start planning your next adventure!
                </p>
              </div>
            </div>
          </div>
        ) : null}
        {visibleIdeas.map((idea) => {
          const tags = parseTags(idea.tags);
          return (
            <div
              key={idea.id}
              id={`idea-${idea.id}`}
              className="card-hover group rounded-2xl border border-[var(--panel-border)] bg-white/70 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-2 break-words overflow-hidden">
                    {idea.title}
                  </h3>
                  {idea.description ? (
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {idea.description}
                    </p>
                  ) : null}
                  {tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag: string) => (
                        <TagBadge key={tag} label={tag} />
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                    Created by {idea.createdBy.name || idea.createdBy.email} on{" "}
                    {formatDate(new Date(idea.createdAt))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <IconButton
                    icon={<CalendarIcon />}
                    label="Schedule as event"
                    variant="ghost"
                    size="md"
                    iconSize="h-5 w-5"
                    className="px-2"
                    onClick={() => setActiveIdeaId(idea.id)}
                  />
                  <IconButton
                    icon={<MessageSquareIcon />}
                    label={`Comments (${commentCounts[idea.id] ?? 0})`}
                    variant="secondary"
                    size="md"
                    iconSize="h-5 w-5"
                    className="px-2"
                    count={commentCounts[idea.id] ?? 0}
                    onClick={() => toggleComments(idea.id)}
                  />
                  <form
                    action={onDelete}
                    onSubmit={(event) => {
                      if (!confirm("Delete this idea?")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="ideaId" value={idea.id} />
                    <IconButton
                      icon={<TrashIcon />}
                      label="Delete idea"
                      variant="danger"
                      size="md"
                      iconSize="h-5 w-5"
                      className="px-2"
                      type="submit"
                    />
                  </form>
                </div>
              </div>
              <IdeaComments
                ideaId={idea.id}
                comments={commentsByIdea[idea.id] ?? []}
                isOpen={Boolean(openComments[idea.id])}
                currentUserId={currentUserId}
                onAddComment={onAddComment}
              />
            </div>
          );
        })}
        {hasMore ? (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] transition hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm"
          >
            Show more ({ideas.length - visibleCount} remaining)
          </button>
        ) : null}
      </div>
      <Modal
        isOpen={Boolean(activeIdea)}
        onClose={() => setActiveIdeaId(null)}
        title="Schedule this idea"
      >
        {activeIdea ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {activeIdea.title}
              </p>
              {activeIdea.description ? (
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {activeIdea.description}
                </p>
              ) : null}
              {parseTags(activeIdea.tags).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {parseTags(activeIdea.tags).map((tag) => (
                    <TagBadge key={tag} label={tag} />
                  ))}
                </div>
              ) : null}
            </div>
            <form className="grid gap-3" action={onSchedule}>
              <input type="hidden" name="ideaId" value={activeIdea.id} />
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                name="date"
                type="date"
                required
              />
              <input
                className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                name="time"
                type="time"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  className="button-hover rounded-xl border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--accent-strong)]"
                  onClick={() => setActiveIdeaId(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="button-hover rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
                  type="submit"
                >
                  Create event
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
