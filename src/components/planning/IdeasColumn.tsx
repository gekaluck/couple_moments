"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";

import EmptyState from "./EmptyState";
import IdeaCard from "./IdeaCard";
import CreateIdeaModal from "./CreateIdeaModal";

type Idea = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  createdAt: Date;
  createdBy: { name: string | null; email: string };
  placeId?: string | null;
  placeName?: string | null;
  placeAddress?: string | null;
  placeLat?: number | null;
  placeLng?: number | null;
  placeUrl?: string | null;
  placeWebsite?: string | null;
  placeOpeningHours?: string[] | null;
  placePhotoUrls?: string[] | null;
};

type IdeaComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

type IdeasColumnProps = {
  ideas: Idea[];
  commentCounts: Record<string, number>;
  commentsByIdea: Record<string, IdeaComment[]>;
  currentUserId: string;
  mapsApiKey?: string;
  onCreateIdea: (formData: FormData) => Promise<void>;
  onScheduleIdea: (formData: FormData) => Promise<void>;
  onAddComment: (formData: FormData) => Promise<void>;
  onDeleteIdea: (formData: FormData) => Promise<void>;
  autoOpen?: boolean;
};

export default function IdeasColumn({
  ideas,
  commentCounts,
  commentsByIdea,
  currentUserId,
  mapsApiKey,
  onCreateIdea,
  onScheduleIdea,
  onAddComment,
  onDeleteIdea,
  autoOpen = false,
}: IdeasColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTag, setActiveTag] = useState("all");

  useEffect(() => {
    if (autoOpen) {
      setIsCreateOpen(true);
    }
  }, [autoOpen]);

  const tagOptions = useMemo(() => {
    const unique = new Set<string>();
    ideas.forEach((idea) => {
      idea.tags.forEach((tag) => unique.add(tag));
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [ideas]);

  const filteredIdeas =
    activeTag === "all"
      ? ideas
      : ideas.filter((idea) => idea.tags.includes(activeTag));
  const hasIdeas = ideas.length > 0;
  const hasFilteredIdeas = filteredIdeas.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              New ideas
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              {ideas.length} ideas
            </p>
          </div>
        </div>
        <button
          className="button-hover rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:bg-amber-600 hover:shadow-[var(--shadow-lg)]"
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          Create idea
        </button>
      </div>
      {tagOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          <button
            className={`rounded-full border px-3 py-1 transition ${
              activeTag === "all"
                ? "border-amber-300 bg-amber-100 text-amber-700"
                : "border-[var(--panel-border)] bg-white/70 text-[var(--text-tertiary)] hover:border-amber-300 hover:text-amber-700"
            }`}
            onClick={() => setActiveTag("all")}
            type="button"
          >
            All
          </button>
          {tagOptions.map((tag) => (
            <button
              key={tag}
              className={`rounded-full border px-3 py-1 transition ${
                activeTag === tag
                  ? "border-amber-300 bg-amber-100 text-amber-700"
                  : "border-[var(--panel-border)] bg-white/70 text-[var(--text-tertiary)] hover:border-amber-300 hover:text-amber-700"
              }`}
              onClick={() => setActiveTag(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
      {!hasIdeas ? (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8 text-amber-500" />}
          title="No ideas yet"
          description="Start planning your next adventure!"
          actionLabel="Create idea"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : !hasFilteredIdeas ? (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8 text-amber-500" />}
          title="No ideas match"
          description="Try a different tag or clear the filter."
          actionLabel="Clear filter"
          onAction={() => setActiveTag("all")}
        />
      ) : (
        <div className="stagger-children flex flex-col gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              commentCount={commentCounts[idea.id] ?? 0}
              comments={commentsByIdea[idea.id] ?? []}
              currentUserId={currentUserId}
              onSchedule={onScheduleIdea}
              onAddComment={onAddComment}
              onDelete={onDeleteIdea}
              onTagClick={(tag) => setActiveTag(tag)}
            />
          ))}
        </div>
      )}
      <CreateIdeaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreateIdea}
        mapsApiKey={mapsApiKey}
      />
    </div>
  );
}
