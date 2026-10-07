"use client";

import { StarIcon, TrashIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

export type AdminReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  createdAt: string;
  createdAtLabel: string;
  productName: string;
  productSlug: string;
  approved: boolean;
};

/**
 * One review in the moderation queue.
 *
 * The card shows the star rating, the review itself, who wrote it and whether
 * they bought the plant. The actions are hoisted to the tabs container, which
 * applies them optimistically — the card's job is to look right and stay out
 * of the way.
 */
export function ReviewCard({
  review,
  onApprove,
  onDelete,
  busy,
}: {
  review: AdminReview;
  onApprove: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className="flex items-center gap-0.5"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              aria-hidden="true"
              className={cn(
                "size-4",
                star <= review.rating
                  ? "fill-forest text-forest"
                  : "text-ink/20",
              )}
            />
          ))}
        </span>
        <h3 className="font-heading text-[0.9375rem] font-semibold text-ink">
          {review.title}
        </h3>
      </div>

      <p className="mt-2.5 text-pretty text-[0.9375rem] leading-relaxed text-ink/85">
        {review.body}
      </p>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink/55">
        <span className="font-medium text-ink">{review.authorName}</span>
        {review.verifiedPurchase ? (
          <span className="text-forest">Verified buyer</span>
        ) : null}
        <span aria-hidden="true">·</span>
        <time>{review.createdAtLabel}</time>
      </p>

      <p className="mt-1 text-small text-ink/45">
        On{" "}
        <span className="font-medium text-forest">{review.productName}</span>
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-ink/10 pt-4">
        {review.approved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-mint px-3 py-1 text-xs font-medium text-forest">
            <CheckIcon aria-hidden="true" className="size-3.5" />
            Published
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={onApprove}
            disabled={busy}
          >
            Approve
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={busy}
          className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon aria-hidden="true" className="size-4" />
          Delete
        </Button>
      </div>
    </article>
  );
}
