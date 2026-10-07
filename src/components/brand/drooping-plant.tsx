import { cn } from "cn";

/**
 * The bench's resident patient: a potted plant that has clearly been through
 * something. Upright leaves, one honest droop, a pot that has seen better days.
 *
 * Used on the 404, the error pages and anywhere else the site has to admit
 * something did not go as planned. Drawn in the brand's strokes rather than a
 * stock illustration so it reads as coming from the same hand as the leaf mark.
 */
export function DroopingPlant({
  className,
  strokeWidth = 3,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      {/* pot, slightly battered at the rim */}
      <path d="M37 76h46l-5 25a8 8 0 0 1-7.5 6.5H49.5A8 8 0 0 1 42 101l-5-25Z" />
      <path d="M35 76h50" />
      {/* soil line */}
      <path d="M40 82h40" strokeWidth={2} />

      {/* stem, leaning under the weight of its opinions */}
      <path d="M59 76V48c0-8-3-13-8-16" />

      {/* one leaf doing its best */}
      <path d="M51 32c-2-13 2-24 14-27 1 13-3 25-14 27Z" />
      <path d="M53 33c4-2 8-3 12-2" strokeWidth={2} />

      {/* one leaf not doing its best */}
      <path d="M52 36c-13-1-22 4-27 16 12 3 20-4 27-16Z" />

      {/* wherever it landed, a puddle has formed */}
      <path
        d="M44 108h32"
        strokeWidth={2}
        strokeDasharray="1 7"
        opacity={0.45}
      />
    </svg>
  );
}