"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
};

export default function MembershipActions({
  isCreator,
  canLeave,
  hasPartner,
  partnerLabel,
  onRemovePartner,
  onLeaveSpace,
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

  return (
    <section className="surface border border-rose-200/60 bg-[linear-gradient(165deg,rgba(255,255,255,0.92),rgba(255,241,245,0.8))] p-6 md:p-8">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">
        Membership Management
      </h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Manage who is in this space. Destructive actions are confirmed first.
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-rose-200/70 bg-white/80 p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Remove partner</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {canRemovePartner
              ? `Remove ${partnerLabel} from this space so you can invite someone else.`
              : hasPartner
                ? "Only the space creator can remove a partner."
                : "No partner is currently connected."}
          </p>
          <button
            type="button"
            onClick={() => setIsRemoveOpen(true)}
            disabled={!canRemovePartner || isPending}
            className="mt-3 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove partner
          </button>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Leave space</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Leave this space. You can only leave when another member remains.
          </p>
          <button
            type="button"
            onClick={() => setIsLeaveOpen(true)}
            disabled={!canLeave || isPending}
            className="mt-3 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Leave space
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        onConfirm={async () =>
          runAction(onRemovePartner, () => setIsRemoveOpen(false))
        }
        title="Remove partner?"
        message={`This will remove ${partnerLabel} from this space. They will lose access immediately.`}
        confirmLabel="Remove partner"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        onConfirm={async () =>
          runAction(onLeaveSpace, () => setIsLeaveOpen(false))
        }
        title="Leave this space?"
        message="You will lose access to this space until you join again via invite code."
        confirmLabel="Leave space"
        variant="danger"
      />
    </section>
  );
}
