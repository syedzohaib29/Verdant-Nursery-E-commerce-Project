import { cn } from "cn";

/**
 * The Verdant mark: a leaf blade tilted off vertical with a stem running out of
 * it. Drawn rather than set in an emoji so it inherits colour and stroke weight
 * like the rest of the icon set, and stays crisp at 20px.
 */
export function LeafMark({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <path d="M20.5 3.5c-9 0-14.5 4-14.5 10.2 0 3.3 2.6 5.6 5.9 5.6 6.4 0 8.6-8.6 8.6-15.8Z" />
      <path d="M4.5 21c2.8-4.2 6.4-7.3 11-9.8" />
    </svg>
  );
}
