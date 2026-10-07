"use client";

import { motion, useReducedMotion } from "motion/react";

import { StarRow } from "@/components/product/star-row";
import type { ReviewSummary } from "@/lib/data/reviews";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The rating histogram.
 *
 * Each bar grows from nothing once, when it first scrolls into view, and never
 * again. `scaleX` rather than `width`: it is a compositor-only property, so eight
 * bars animating together do not cost eight layout passes, and the counts beside
 * them do not move while it happens.
 *
 * The bar is a track with a fill, not a fill alone. A bar sized to its own
 * percentage would make four stars look as solid as five when four stars has one
 * review behind it and five has twenty.
 *
 * The number and the bars sit side by side or stacked depending on `@container`,
 * not on a viewport breakpoint, because this block is used at two very different
 * widths — full bleed under the Description tab, and a narrow left-hand column
 * beside the reviews. A `sm:` query would have forced the wide layout inside a
 * 288px column and squeezed the bars into a stub.
 *
 * `container-type` sits on the wrapper rather than on the row itself. A container
 * query resolves against the nearest *ancestor* container and never against the
 * element that declares it, so `@container` and `@md:` on one node compile to two
 * rules that both land on that node and the row stayed stacked at every width.
 */
export function RatingBars({ summary }: { summary: ReviewSummary }) {
  const reduceMotion = useReducedMotion();

  if (summary.total === 0) return null;

  return (
    <div className="@container">
      <div className="flex flex-col gap-6 @md:flex-row @md:items-center @md:gap-10">
        <div className="shrink-0 @md:w-32 @md:text-center">
          <p className="tabular-nums font-heading text-[2.75rem] leading-none font-semibold tracking-[-0.03em] text-ink">
            {summary.average.toFixed(1)}
          </p>
          <StarRow rating={summary.average} className="mt-2" />
          <p className="mt-2 text-small text-text-muted">
            {summary.total} {summary.total === 1 ? "review" : "reviews"}
          </p>
          <p className="tabular-nums mt-1 text-small text-forest">
            {summary.positivePercent}% rated it 4 or 5
          </p>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {summary.distribution.map((row) => (
            <li key={row.rating} className="flex items-center gap-3">
              <span className="tabular-nums w-3 shrink-0 text-right text-small text-text-muted">
                {row.rating}
              </span>

              <span
                className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/[0.07]"
                role="img"
                aria-label={`${row.count} ${row.rating}-star reviews`}
              >
                <motion.span
                  initial={{ scaleX: reduceMotion ? 1 : 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                  transition={{ duration: 0.55, ease: EASE }}
                  style={{
                    width: `${row.percent}%`,
                    transformOrigin: "left",
                  }}
                  className="block h-full rounded-full bg-forest"
                />
              </span>

              <span className="tabular-nums w-8 shrink-0 text-small text-text-muted">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
