"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";

import { toggleWishlist } from "@/app/actions/wishlist";
import { useWishlistStore, useWishlistHydrated } from "@/store/wishlist";

import { cn } from "cn";

/**
 * The heart.
 *
 * Two states have to coexist in one control. Before localStorage has been read
 * there is no honest answer to "is this saved?", and rendering a guess is what
 * produces a heart that fills in after the page has settled. So the button accepts
 * an `initialSaved` from the server — which the product page has from the
 * database — and uses it until hydration catches up. For a card in a listing that
 * is `false`, which is right for guests and briefly optimistic for customers, and
 * the only case where the fill appears without having been asked for.
 *
 * Optimistic on purpose. A heart is a one-tap gesture, and waiting on a round trip
 * to draw it makes the whole site feel like it is thinking. If the server says no,
 * the store is put back exactly as it was and the reason is announced politely.
 *
 * The pop is 250ms and it only plays on a tap. A heart that bounces on page load
 * for every saved plant is an animation nobody asked for.
 */
export function WishlistButton({
  productId,
  productName,
  initialSaved = false,
  className,
}: {
  productId: string;
  productName: string;
  /** From the database, for the product page. False on a card in a listing. */
  initialSaved?: boolean;
  className?: string;
}) {
  const hydrated = useWishlistHydrated();
  const saved = useWishlistStore((state) => state.ids.includes(productId));
  const add = useWishlistStore((state) => state.add);
  const remove = useWishlistStore((state) => state.remove);

  const reduceMotion = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [announced, setAnnounced] = useState("");

  /**
   * Counts taps. The pop is keyed on this rather than on `filled`, because
   * `filled` stops changing after the first toggle — keying on it alone would
   * animate once and never again. A counter also lets the pop be skipped entirely
   * on load: a heart that bounces for every saved plant on the page is an
   * animation nobody asked for.
   */
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    if (!announced) return;

    // Cleared after a beat so the same message can be announced twice in a row —
    // two failures on the same plant would otherwise be identical text and a
    // screen reader would say nothing the second time.
    const timer = setTimeout(() => setAnnounced(""), 4000);

    return () => clearTimeout(timer);
  }, [announced]);

  const onToggle = useCallback(() => {
    const next = !(hydrated ? saved : initialSaved);

    // Applied locally first, then reconciled. A heart that refuses a second tap
    // while the first is in flight feels broken, and the rollback below is what
    // makes the optimism safe — so nothing is blocked on `pending`.
    if (next) add(productId);
    else remove(productId);

    setTaps((count) => count + 1);

    startTransition(async () => {
      const result = await toggleWishlist({ productId, saved: next });

      if (!result.success) {
        // Put it back exactly as it was.
        if (next) remove(productId);
        else add(productId);

        setAnnounced(result.error ?? "We could not save that plant.");
      }
    });
  }, [add, hydrated, initialSaved, productId, remove, saved]);

  const filled = hydrated ? saved : initialSaved;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={filled}
        data-pending={pending || undefined}
        aria-label={
          filled
            ? `Remove ${productName} from your wishlist`
            : `Save ${productName} to your wishlist`
        }
        className={cn(
          "flex size-9 items-center justify-center rounded-full border border-ink/10 bg-white/85 text-ink backdrop-blur-sm transition-[color,background-color,border-color] duration-200 ease-verdant hover:border-forest/40 hover:bg-white hover:text-forest disabled:cursor-progress",
          filled && "border-forest/25 bg-mint text-forest",
          className,
        )}
      >
        <motion.span
          // Remounting on this key is what replays the pop. `taps` is in the key so
          // the same heart filled twice in a row animates twice, and `0` is the
          // pre-hydration state, which renders without animating at all.
          key={taps}
          initial={reduceMotion || taps === 0 ? false : { scale: 1 }}
          animate={{ scale: [1, 1.32, 0.94, 1] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
          }
          className="flex items-center justify-center"
        >
          <HeartGlyph filled={filled} />
        </motion.span>
      </button>

      {/* Announcements for assistive technology and for the optimistic rollback. */}
      <span role="status" aria-live="polite" className="sr-only">
        {announced}
      </span>
    </>
  );
}

/**
 * The glyph. Split out because the animation wraps it, and a `motion.span` around
 * an `aria-hidden` icon is the only combination that animates without the icon
 * being announced twice.
 */
function HeartGlyph({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[1.125rem]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 1.25 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 5.9a5.1 5.1 0 0 0-7.2 0L12 7.5l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2l1.6 1.6L12 22l7.2-7.3 1.6-1.6a5.1 5.1 0 0 0 0-7.2Z" />
    </svg>
  );
}
