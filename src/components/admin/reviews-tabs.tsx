"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquareIcon } from "lucide-react";

import {
  deleteReviewAction,
  setReviewApprovedAction,
} from "@/app/actions/admin-reviews";
import { EmptyState } from "@/components/admin/empty-state";
import { ReviewCard, type AdminReview } from "@/components/admin/review-card";
import { cn } from "cn";

/*
  The moderation queue, as two tabs.

  Approving and deleting are optimistic: the card moves (or disappears) the
  moment the button is pressed, while the server action is still on the wire.
  The optimistic overlay reads from the props, so the refresh that follows a
  successful action settles it into the truth — and a failed action simply
  reverts to what the server said, with a toast explaining why.
*/

type Tab = "pending" | "approved";

export function ReviewsTabs({
  pending,
  approved,
}: {
  pending: AdminReview[];
  approved: AdminReview[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [state, applyOptimistic] = useOptimistic(
    { pending, approved },
    (current, action: { type: "approve" | "delete"; review: AdminReview }) => {
      if (action.type === "approve") {
        return {
          pending: current.pending.filter(
            (review) => review.id !== action.review.id,
          ),
          approved: [
            { ...action.review, approved: true },
            ...current.approved,
          ],
        };
      }

      return {
        pending: current.pending.filter(
          (review) => review.id !== action.review.id,
        ),
        approved: current.approved.filter(
          (review) => review.id !== action.review.id,
        ),
      };
    },
  );

  function approve(review: AdminReview) {
    setBusyId(review.id);

    startTransition(async () => {
      applyOptimistic({ type: "approve", review });

      const result = await setReviewApprovedAction({
        reviewId: review.id,
        approved: true,
      });

      setBusyId(null);

      if (result.success) {
        toast.success("Review approved.", {
          description: `It is now live on ${review.productName}.`,
        });
        router.refresh();
      } else {
        toast.error(result.error || "We could not approve that review.");
      }
    });
  }

  function remove(review: AdminReview) {
    setBusyId(review.id);

    startTransition(async () => {
      applyOptimistic({ type: "delete", review });

      const result = await deleteReviewAction({ reviewId: review.id });

      setBusyId(null);

      if (result.success) {
        toast.success("Review deleted.", {
          description: `“${review.title}” on ${review.productName}.`,
        });
        router.refresh();
      } else {
        toast.error(result.error || "We could not delete that review.");
      }
    });
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: state.pending.length },
    { key: "approved", label: "Published", count: state.approved.length },
  ];

  const visible = tab === "pending" ? state.pending : state.approved;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2" role="tablist" aria-label="Review moderation tabs">
        {tabs.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            onClick={() => setTab(entry.key)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              tab === entry.key
                ? "border-forest bg-forest text-white"
                : "border-ink/15 bg-white text-ink/65 hover:border-ink/35 hover:text-ink",
            )}
          >
            {entry.label}
            <span
              className={cn(
                "text-xs tabular-nums",
                tab === entry.key ? "text-white/70" : "text-ink/40",
              )}
            >
              {entry.count}
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tab === "pending" ? "Pending reviews" : "Published reviews"}>
        {visible.length === 0 ? (
          <div className="rounded-xl border border-ink/10 bg-white">
            <EmptyState
              icon={MessageSquareIcon}
              title={
                tab === "pending" ? "Nothing to moderate" : "No published reviews"
              }
              description={
                tab === "pending"
                  ? "Every review has been dealt with. The queue is clear."
                  : "Approved reviews appear here and on the product pages."
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                busy={busyId === review.id}
                onApprove={() => approve(review)}
                onDelete={() => remove(review)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
