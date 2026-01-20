"use client";

import { useState } from "react";
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
}: IdeasColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
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
          className="button-hover rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          Create idea
        </button>
      </div>
      {ideas.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8 text-amber-500" />}
          title="No ideas yet"
          description="Start planning your next adventure!"
          actionLabel="Create idea"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              commentCount={commentCounts[idea.id] ?? 0}
              comments={commentsByIdea[idea.id] ?? []}
              currentUserId={currentUserId}
              onSchedule={onScheduleIdea}
              onAddComment={onAddComment}
              onDelete={onDeleteIdea}
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
