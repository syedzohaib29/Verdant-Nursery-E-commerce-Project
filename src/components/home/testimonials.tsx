import Link from "next/link";
import { BadgeCheckIcon } from "lucide-react";

import { StarRow } from "@/components/product/star-row";
import { Reveal } from "@/components/motion/reveal";
import type { ReviewItem } from "@/lib/data/reviews";

import { cn } from "cn";

export type Testimonial = ReviewItem & {
  productName: string;
  productSlug: string;
};

/*
  Testimonials.

  Not a row of three equal cards. One long review is given the room to be read at
  text size, and the other three step down the page beside it, each starting a
  little lower than the last. That shape does two things a grid cannot: it says
  which review the shop actually stands behind, and it stops the section looking
  like the three-card template it came from.
*/

/** How far down the column each small quote starts. */
const STAGGER = ["", "lg:mt-10", "lg:mt-20"] as const;

/**
 * Picks the review to feature.
 *
 * Five stars, then the longest write-up among them: the one a customer spent
 * effort on is the one worth giving the space. Ties break on the earlier date, so
 * the choice is stable between builds rather than depending on row order.
 */
function pickLead(reviews: Testimonial[]): number {
  let best = 0;

  for (let index = 1; index < reviews.length; index += 1) {
    const candidate = reviews[index];
    const incumbent = reviews[best];
    const better =
      candidate.rating > incumbent.rating ||
      (candidate.rating === incumbent.rating &&
        (candidate.body.length > incumbent.body.length ||
          (candidate.body.length === incumbent.body.length &&
            candidate.createdAt < incumbent.createdAt)));

    if (better) best = index;
  }

  return best;
}

export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  if (reviews.length < 2) return null;

  const leadIndex = pickLead(reviews);
  const lead = reviews[leadIndex];
  const rest = reviews.filter((_, index) => index !== leadIndex).slice(0, 3);

  const average =
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/10 pb-6">
            <div>
              <p className="eyebrow">What people wrote back</p>
              <h2 className="mt-3 max-w-[20ch] text-h2 text-ink">
                Reviews, published whether we liked them or not.
              </h2>
            </div>

            <p className="tabular-nums text-small text-text-muted">
              {average.toFixed(1)} average across these {reviews.length}
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-y-10 lg:grid-cols-12 lg:gap-x-14">
          <Reveal className="lg:col-span-7">
            <figure className="lg:sticky lg:top-28">
              <blockquote>
                <p className="font-heading text-h3 text-ink">
                  <span aria-hidden="true" className="text-forest/40">
                    “
                  </span>
                  {lead.body}
                </p>
              </blockquote>

              <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/10 pt-5">
                <span className="text-[0.9375rem] font-medium text-ink">
                  {lead.authorName}
                </span>

                <span aria-hidden="true" className="text-ink/25">
                  —
                </span>

                <Link
                  href={`/shop/${lead.productSlug}`}
                  className="rounded-sm text-[0.9375rem] text-forest underline-offset-4 hover:underline"
                >
                  {lead.productName}
                </Link>

                <Verified verified={lead.verifiedPurchase} />

                <StarRow rating={lead.rating} className="ml-auto" />
              </figcaption>
            </figure>
          </Reveal>

          <div className="lg:col-span-5">
            {rest.map((review, index) => (
              <Reveal
                key={review.id}
                delay={0.06 * (index + 1)}
                className={cn(STAGGER[index] ?? "")}
              >
                <figure className="border-t border-ink/10 pb-8 lg:pb-10">
                  <StarRow rating={review.rating} />

                  <blockquote className="mt-3">
                    <p className="text-[0.9375rem] leading-relaxed text-ink">
                      {review.body}
                    </p>
                  </blockquote>

                  <figcaption className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-muted">
                    <span className="font-medium text-ink">{review.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <Link
                      href={`/shop/${review.productSlug}`}
                      className="rounded-sm text-forest underline-offset-4 hover:underline"
                    >
                      {review.productName}
                    </Link>
                    <Verified verified={review.verifiedPurchase} />
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Verified({ verified }: { verified: boolean }) {
  if (!verified) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[0.75rem] text-forest">
      <BadgeCheckIcon aria-hidden="true" className="size-3.5" strokeWidth={2} />
      Verified buyer
    </span>
  );
}