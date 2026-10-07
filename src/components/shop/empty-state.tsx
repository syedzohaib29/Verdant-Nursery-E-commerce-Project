import Link from "next/link";

import { Button } from "@/components/ui/button";
import { hasActiveFilters, shopHref, type ShopQuery } from "@/lib/shop-query";

/**
 * Nothing matched.
 *
 * The illustration is drawn rather than fetched: a 120-unit inline SVG costs
 * nothing, cannot be a broken image on the one page whose entire job is to say
 * "we found nothing", and takes its colour from the text around it.
 *
 * The offers are the only two worth making: clear what you asked for, or keep the
 * filters and drop just the search term. A "contact us" link on a search miss is a
 * tidy way of making our own filtering look broken.
 */
export function ShopEmptyState({ query }: { query: ShopQuery }) {
  const filtered = hasActiveFilters(query);
  const searching = query.q !== null;

  return (
    <div className="flex flex-col items-center border-t border-ink/10 py-20 text-center">
      <EmptyIllustration />

      <h2 className="mt-7 text-h3 text-ink">
        {filtered ? "Nothing matches all of that." : "The greenhouse is empty."}
      </h2>

      <p className="mt-3 max-w-sm text-pretty text-body text-text-muted">
        {filtered
          ? "Filters stack, and light plus a price plus a pet-safe check is a narrow room. Loosening one of them usually does it."
          : "No plants are on the shelf yet. The greenhouse is still being stocked — do check back soon."}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {searching ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={shopHref({ ...query, q: null })} />}
          >
            Drop the search, keep the filters
          </Button>
        ) : null}

        {filtered ? (
          <Button nativeButton={false} render={<Link href="/shop" />}>
            Clear every filter
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyIllustration() {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label="An empty plant pot with nothing in it"
      className="size-24 text-forest/30"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The pot, drawn the way the rest of the catalogue draws one: a trapezoid
          with a rim, no shading, no gradient. */}
      <path d="M38 60h44l-5 44H43z" />
      <path d="M33 48h54v12H33z" />

      {/* Two stems that stopped short. The gap where the leaves should be is the
          whole point of the picture, so it is left empty on purpose. */}
      <path d="M60 48V30" />
      <path d="M60 30c-6-2-10-6-12-11 6 1 10 4 12 8" />
      <path d="M60 30c6-2 10-6 12-11-6 1-10 4-12 8" />

      {/* The pot's shadow, so the shape sits on something. */}
      <path d="M30 108h60" opacity={0.4} />
    </svg>
  );
}
