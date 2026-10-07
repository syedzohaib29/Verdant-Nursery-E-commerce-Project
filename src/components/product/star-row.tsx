import { StarIcon } from "lucide-react";

import { cn } from "cn";

/**
 * Five stars, filled to the rounded rating.
 *
 * The whole row is one `img` role with a spoken label, and each star is hidden
 * from assistive tech. Reading out "star star star star star, empty" tells a
 * screen reader user nothing about the score; "4.3 out of 5 stars" tells them
 * exactly what they need.
 */
export function StarRow({
  rating,
  count,
  className,
}: {
  rating: number;
  /** Optional. When given it replaces the numeric label, e.g. "37 reviews". */
  count?: number;
  className?: string;
}) {
  const filled = Math.round(rating);

  const label =
    count === undefined
      ? `${rating} out of 5 stars`
      : `Rated ${rating} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`;

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <StarIcon
          key={position}
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn(
            "size-4",
            position <= filled ? "fill-forest text-forest" : "text-ink/20",
          )}
        />
      ))}
    </span>
  );
}