"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PawPrintIcon,
  ShieldCheckIcon,
  SproutIcon,
  TruckIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "cn";

/**
 * The promise strip, on a phone.
 *
 * Four promises do not fit a 360px screen, so below `sm` they run in a horizontal
 * scroller — which was correct and, on its own, unusable: nothing on the strip
 * said it scrolled, and the second promise sat half off the edge with its title
 * cut through the middle of a word. A carousel nobody is told about is a layout
 * bug with better manners.
 *
 * So the arrows. Two 44px buttons, one item's worth of travel each, disabled at
 * the ends so they report where there is somewhere to go, and set beneath the
 * strip rather than over its edges — at 320px an arrow parked on the margin
 * covers a third of the promise it is about. A white fade on each edge does the
 * rest: a promise running off the side on purpose reads as deliberate, where the
 * same text chopped by the viewport reads as a layout bug.
 *
 * Above `sm` the scroller becomes a plain four-column grid and the arrows and
 * fades stand down entirely; they are never both on at once.
 */

export type PromiseItem = {
  icon: "shield" | "paw" | "truck" | "sprout";
  title: string;
  body: string;
  /** Present when the promise has a page behind it. */
  href?: string;
};

const ICONS: Record<PromiseItem["icon"], LucideIcon> = {
  shield: ShieldCheckIcon,
  paw: PawPrintIcon,
  truck: TruckIcon,
  sprout: SproutIcon,
};

/** How far one press moves the strip: one card plus the gap. */
const STEP_GAP = 12;

export function TrustScroller({ items }: { items: PromiseItem[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const element = track.current;
    if (!element) return;

    // One pixel of slack, because a fractional device pixel ratio makes a settled
    // scroller report 0.5px of overflow and an arrow that stays enabled on the
    // last card is worse than no arrow.
    setAtStart(element.scrollLeft <= 1);
    setAtEnd(
      element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    );
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;

    measure();
    element.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      element.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const nudge = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;

    const card = element.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + STEP_GAP : element.clientWidth;

    element.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* The fades sit above the scroller's own padding and below the arrows, so
          text runs under a white edge instead of being chopped by it. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 sm:hidden",
          atStart ? "opacity-0" : "opacity-100",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 sm:hidden",
          atEnd ? "opacity-0" : "opacity-100",
        )}
      />

      {/* `scroll-px-5` beside `px-5` is load-bearing, not decorative. With
          `snap-start` and left padding alone, the browser snaps the first card to
          its *content* start edge, which sits 20px inside the padding box, so the
          strip came to rest scrolled by 20px — the left fade sat over the first
          promise and the "previous" arrow was enabled on a strip that had not
          moved. Snap padding pulls the alignment port out over the gutter, so the
          resting position is genuinely zero. */}
      <ul
        ref={track}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 sm:overflow-visible sm:px-0 lg:grid-cols-4"
      >
        {items.map((item, index) => (
          <li
            key={item.title}
            className={cn(
              "snap-start",
              index > 0 && "pl-5 sm:border-l sm:border-ink/10 sm:pl-8",
            )}
          >
            <div
              className={cn(
                "flex h-full w-[15.5rem] flex-col rounded-sm py-6 sm:w-auto",
                item.href && "group/trust",
              )}
            >
              <PromiseBody icon={item.icon} title={item.title} body={item.body} />

              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-3 w-fit rounded-sm text-small font-medium text-forest underline-offset-4 group-hover/trust:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  See how
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {/* Phone only, and *under* the strip rather than over it. Overlaying them
          on the edges was tried first and rejected: at 320px an arrow covers a
          third of the promise it is meant to be reading about, and there is no
          honest way to hide it. A row of two 44px targets beneath the strip costs
          one line of height and never sits on top of a word. Disabled at an end
          rather than removed, so the pair does not shuffle sideways as the strip
          settles. At `sm` the strip is a four-column grid with nothing to scroll,
          so both controls stand down. */}
      <div className="mt-1 flex items-center justify-end gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atStart}
          aria-label="Previous promises"
          className="flex size-11 items-center justify-center rounded-full border border-ink/15 bg-white text-forest transition-colors duration-200 ease-verdant hover:bg-mint disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atEnd}
          aria-label="More promises"
          className="flex size-11 items-center justify-center rounded-full border border-ink/15 bg-white text-forest transition-colors duration-200 ease-verdant hover:bg-mint disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRightIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function PromiseBody({
  icon,
  title,
  body,
}: {
  icon: PromiseItem["icon"];
  title: string;
  body: string;
}) {
  const Icon = ICONS[icon];

  return (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-forest" strokeWidth={1.75} />
      <span className="mt-4 block text-[0.9375rem] leading-tight font-semibold tracking-[-0.01em] text-ink">
        {title}
      </span>
      <span className="mt-2 block text-small leading-relaxed text-text-muted">
        {body}
      </span>
    </>
  );
}
