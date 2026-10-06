import Link from "next/link";

import { Button } from "@/components/ui/button";

import { cn } from "cn";

/**
 * The empty basket.
 *
 * Hand-drawn rather than an icon, because an outline of a shopping bag next to the
 * words "your basket is empty" is saying the same thing twice in the ugliest way
 * available. This is a pot with nothing in it — the actual joke the nursery would
 * make — and it takes up no vertical space on the page.
 *
 * `tone="dark"` for the forest-green pages, where the drawing has to be ink-on-dark
 * and the button has to invert.
 */
export function CartEmptyState({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        className,
      )}
    >
      <svg
        viewBox="0 0 120 104"
        role="img"
        aria-label="An empty plant pot on a bench"
        className={cn("h-24 w-auto", dark ? "text-white/70" : "text-forest/45")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Bench */}
        <path d="M14 88h92" />
        <path d="M22 88v8M98 88v8" opacity="0.45" />

        {/* Pot */}
        <path d="M40 48h40l-4 30a4 4 0 0 1-4 3.5H48a4 4 0 0 1-4-3.5Z" />
        <path d="M36 42h48v6H36z" opacity="0.6" />

        {/* Soil, with one small sprout that did not get the message */}
        <path d="M44 42c2-3 6-4 10-3" opacity="0.5" />
        <path d="M60 41V29" />
        <path d="M60 33c-5 0-8-2.5-8.5-6.5 4.5-.5 8 1.5 8.5 6.5Z" opacity="0.7" />
        <path d="M60 35c4.5-.5 7.5-3 8-7-4-.5-7.5 2-8 7Z" opacity="0.7" />
      </svg>

      <p
        className={cn(
          "mt-6 font-heading text-xl font-semibold tracking-[-0.02em]",
          dark ? "text-white" : "text-ink",
        )}
      >
        Nothing in the basket yet
      </p>

      <p
        className={cn(
          "mt-2 max-w-xs text-[0.9375rem] leading-relaxed",
          dark ? "text-white/65" : "text-ink/60",
        )}
      >
        Have a look at what is on the bench. Everything here will tell you honestly
        how fussy it is.
      </p>

      <Button
        nativeButton={false}
        render={<Link href="/shop" />}
        variant={dark ? "inverted" : "primary"}
        size="lg"
        className="mt-6"
      >
        Browse the shop
      </Button>
    </div>
  );
}
