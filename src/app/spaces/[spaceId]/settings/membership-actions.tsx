"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, UsersRound } from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";

type ActionResult = {
  ok: boolean;
  message?: string;
  redirectTo?: string;
};

type MembershipActionsProps = {
  isCreator: boolean;
  canLeave: boolean;
  hasPartner: boolean;
  partnerLabel: string;
  onRemovePartner: () => Promise<ActionResult>;
  onLeaveSpace: () => Promise<ActionResult>;
  embedded?: boolean;
};

export default function MembershipActions({
  isCreator,
  canLeave,
  hasPartner,
  partnerLabel,
  onRemovePartner,
  onLeaveSpace,
  embedded = false,
}: MembershipActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  const canRemovePartner = isCreator && hasPartner;

  async function runAction(action: () => Promise<ActionResult>, close: () => void) {
    try {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message ?? "Action failed.");
        return;
      }
      toast.success(result.message ?? "Done.");
      close();
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Action failed.");
    }
  }

  const body = (
    <>
      {!embedded ? (
        <>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Space access
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            See who shares this space and review access changes.
          </p>
        </>
      ) : null}

      <div className={embedded ? "space-y-3" : "mt-5 space-y-3"}>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-white/75 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <UsersRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {hasPartner ? `Sharing with ${partnerLabel}` : "Only you are in this space"}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--text-muted)]">
              {hasPartner
                ? "Your shared calendar, ideas, and memories stay together here."
                : "Invite someone whenever you are ready to share this space."}
            </p>
          </div>
        </div>

        <details className="group overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-white/60">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-white/75 [&::-webkit-details-marker]:hidden">
            <span className="flex-1">Changes to this space</span>
            <span className="text-xs font-normal text-[var(--text-tertiary)]">Review options</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform group-open:rotate-90" />
          </summary>

          <div className="divide-y divide-[var(--panel-border)] border-t border-[var(--panel-border)]">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {hasPartner ? `Stop sharing with ${partnerLabel}` : "Sharing access"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  {canRemovePartner
                    ? `${partnerLabel} would lose access to this space. Nothing changes until you confirm.`
                    : hasPartner
                      ? "Only the space owner can change the other member’s access."
                      : "There is no other member to disconnect."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoveOpen(true)}
                disabled={!canRemovePartner || isPending}
                className="self-start rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45 sm:self-center"
              >
                Review
              </button>
            </div>

            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 gap-3">
                <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Leave this shared space
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    {canLeave
                      ? "You would lose access while the other member keeps the space."
                      : "You can leave only when another member remains in the space."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveOpen(true)}
                disabled={!canLeave || isPending}
                className="self-start rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-45 sm:self-center"
              >
                Review
              </button>
            </div>
          </div>
        </details>
      </div>

      <ConfirmDialog
        isOpen={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        onConfirm={async () =>
          runAction(onRemovePartner, () => setIsRemoveOpen(false))
        }
        title={`Stop sharing with ${partnerLabel}?`}
        message={`${partnerLabel} will lose access to this space immediately. This changes access only; it does not delete the space.`}
        confirmLabel="Stop sharing"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        onConfirm={async () =>
          runAction(onLeaveSpace, () => setIsLeaveOpen(false))
        }
        title="Leave this shared space?"
        message="You will lose access, while the other member and the shared space remain. You can rejoin later with a new invite."
        confirmLabel="Leave space"
        variant="danger"
      />
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <section className="surface border border-rose-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.92),rgba(255,241,245,0.8))] p-6 md:p-8">
      {body}
    </section>
  );
}
