"use client";

import { useOptimistic, useTransition, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    name: string | null;
    email: string;
  };
};

type EventCommentsProps = {
  eventId: string;
  initialComments: Comment[];
  currentUser: {
    name: string | null;
    email: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
};

function formatTimestamp(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string | null, email: string) {
  const value = (name ?? "").trim();
  if (value) {
    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-500",
];

export default function EventComments({
  eventId,
  initialComments,
  currentUser,
  onSubmit,
}: EventCommentsProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state, comment: Comment) => [...state, comment],
  );

  function handleSubmit(formData: FormData) {
    const content = formData.get("content")?.toString().trim() ?? "";
    if (!content) {
      return;
    }
    formRef.current?.reset();
    startTransition(async () => {
      addOptimisticComment({
        id: `optimistic-${Date.now()}`,
        body: content,
        createdAt: new Date().toISOString(),
        author: {
          name: currentUser.name,
          email: currentUser.email,
        },
      });
      try {
        await onSubmit(formData);
        toast.success("Comment posted");
      } catch {
        toast.error("Failed to post comment");
      }
    });
  }

  return (
    <section id="event-comments" className="surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          Comments
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">
          {optimisticComments.length} total
        </span>
      </div>
      <form ref={formRef} className="mt-4 flex flex-col gap-3" action={handleSubmit}>
        <input type="hidden" name="eventId" value={eventId} />
        <textarea
          className="min-h-[110px] rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          name="content"
          placeholder="Leave a comment..."
          required
        />
        <div className="flex justify-end">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {isPending ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>
      <div className="mt-6 flex flex-col gap-4">
        {optimisticComments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No comments yet. Start the conversation.
          </p>
        ) : null}
        {optimisticComments.map((comment, index) => (
          <div
            key={comment.id}
            className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-3"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white bg-gradient-to-br ${
                  AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
                }`}
              >
                {getInitials(comment.author.name, comment.author.email)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {comment.author.name || comment.author.email}
                  </span>
                  <span>• {formatTimestamp(comment.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-primary)]">
                  {comment.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

