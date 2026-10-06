import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "cn";

/**
 * The product card, unloaded.
 *
 * Every box here mirrors a real one in `ProductCard` — same 4:5 image, same 13px
 * category line, same 6px gap, same 17px heading, same 8px gap above the price —
 * because a skeleton a different shape from the thing it replaces is worse than no
 * skeleton at all. It is the layout shift you were trying to prevent, arriving
 * early.
 *
 * The two-line heading is the part people notice. Product names wrap to two lines
 * often enough that a one-line placeholder would shrink the grid by a row height
 * every time the real cards landed.
 */
export function ProductCardSkeleton({
  className,
  lines = 2,
}: {
  className?: string;
  /** Heading lines to reserve. Defaults to the common case. */
  lines?: 1 | 2;
}) {
  return (
    <div className={cn("flex flex-col", className)} aria-hidden="true">
      <Skeleton className="aspect-[4/5] w-full rounded-lg" />

      <div className="mt-3 flex flex-1 flex-col">
        <Skeleton className="h-[0.8125rem] w-24 rounded-full" />

        <div className="mt-1.5 space-y-1.5">
          {Array.from({ length: lines }, (_, index) => (
            <Skeleton
              key={index}
              // The last line stops short, the way a wrapped name does.
              className={cn(
                "h-[1.25rem] rounded-full",
                index === lines - 1 ? "w-2/5" : "w-full",
              )}
            />
          ))}
        </div>

        <div className="mt-auto pt-2">
          <Skeleton className="h-[1.125rem] w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * A grid of card skeletons on the same column counts as the real shop grid, so the
 * rows reserved here are the rows that will actually be filled.
 */
export function ProductGridSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-6 xl:grid-cols-4 xl:gap-x-8",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} lines={index % 3 === 0 ? 2 : 1} />
      ))}
    </div>
  );
}
