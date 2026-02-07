"use client";

import { useEffect, useState } from "react";
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
  hasGoogleCalendar?: boolean;
  onCreateIdea: (formData: FormData) => Promise<void>;
  onScheduleIdea: (formData: FormData) => Promise<void>;
  onAddComment: (formData: FormData) => Promise<void>;
  onDeleteIdea: (formData: FormData) => Promise<void>;
  onEditIdea: (formData: FormData) => Promise<void>;
  autoOpen?: boolean;
};

export default function IdeasColumn({
  ideas,
  commentCounts,
  commentsByIdea,
  currentUserId,
  mapsApiKey,
  hasGoogleCalendar = false,
  onCreateIdea,
  onScheduleIdea,
  onAddComment,
  onDeleteIdea,
  onEditIdea,
  autoOpen = false,
}: IdeasColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      setIsCreateOpen(true);
    }
  }, [autoOpen]);

  const hasIdeas = ideas.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50/90 text-amber-700 shadow-[var(--shadow-sm)]">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
              New ideas
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              {ideas.length} ideas
            </p>
          </div>
        </div>
        <button
          className="button-hover rounded-full border border-amber-300 bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-amber-600"
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          Create idea
        </button>
      </div>
      {!hasIdeas ? (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8 text-amber-500" />}
          title="No ideas yet"
          description="Start planning your next adventure!"
          actionLabel="Create idea"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="stagger-children flex flex-col gap-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              commentCount={commentCounts[idea.id] ?? 0}
              comments={commentsByIdea[idea.id] ?? []}
              currentUserId={currentUserId}
              mapsApiKey={mapsApiKey}
              hasGoogleCalendar={hasGoogleCalendar}
              onSchedule={onScheduleIdea}
              onAddComment={onAddComment}
              onDelete={onDeleteIdea}
              onEdit={onEditIdea}
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
