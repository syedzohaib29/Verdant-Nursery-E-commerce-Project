"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";

import { getWishlistCards, toggleWishlist } from "@/app/actions/wishlist";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

import { cn } from "cn";

/**
 * Saved plants.
 *
 * The list of ids is in the browser — for a guest that is the whole record, and for
 * a signed-in customer it was copied there at sign-in — so this page has to ask the
 * server to turn those ids back into products with names and photographs. One
 * action, one query, and no server round trip per heart.
 *
 * Ids that no longer resolve come back as absent rather than as a gap, which is why
 * the store is reconciled against what the server sent: a saved plant that has been
 * taken off sale should stop being offered as saved, and the only thing that knows
 * that is the catalogue.
 */
export function WishlistView() {
  const ids = useWishlistStore((state) => state.ids);
  const hydrated = useWishlistStore((state) => state.hydrated);
  const replace = useWishlistStore((state) => state.replace);
  const remove = useWishlistStore((state) => state.remove);
  const addItem = useCartStore((state) => state.addItem);
  const markAdded = useCartStore((state) => state.markAdded);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const reduceMotion = useReducedMotion();

  const [cards, setCards] = useState<ProductCardData[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  /**
   * A key per fetch, so a slow earlier load cannot overwrite a newer one — which is
   * exactly what happens when somebody taps a heart while the page is still
   * resolving, because both fetches are in flight and they do not come back in the
   * order they were sent.
   */
  const requestId = useRef(0);

  useEffect(() => {
    if (!hydrated) return;

    const id = ++requestId.current;

    void (async () => {
      const result = await getWishlistCards({ productIds: ids });

      if (id !== requestId.current) return;

      if (!result.success) {
        setFailed(result.error ?? "We could not load your wishlist.");
        setCards([]);
        return;
      }

      setFailed(null);
      setCards(result.cards);

      // Drop anything the catalogue no longer has, so the local record and the
      // page agree. Only ever a removal — a card that came back is already there.
      if (result.cards.length !== ids.length) {
        replace(result.cards.map((card) => card.id));
      }
    })();
  }, [hydrated, ids, replace, requestId]);

  /**
   * Remove a saved plant.
   *
   * Optimistic, with the row animating out while the server is told. The local
   * store is the record, so waiting would mean the heart on the card behind the
   * drawer still showed as filled after the customer had taken it off the list.
   */
  async function unsave(productId: string) {
    remove(productId);

    const result = await toggleWishlist({ productId, saved: false });

    if (!result.success) {
      // Put it back. The card is already gone from the DOM, so it comes back when
      // the store changes and the customer is told why.
      useWishlistStore.getState().add(productId);
      toast.error(result.error ?? "We could not update your wishlist.");
    }
  }

  function addEverything() {
    if (!cards || cards.length === 0) return;

    setAddingAll(true);

    let added = 0;
    let firstAddedId: string | null = null;

    for (const card of cards) {
      if (!card.inStock) continue;

      // One of each. Somebody who saved twelve plants wants twelve plants in the
      // basket, not the whole nursery's stock of them — the stepper is there for
      // when they decide they want three of something.
      addItem(
        {
          productId: card.id,
          slug: card.slug,
          name: card.name,
          priceCents: card.effectivePriceCents,
          image: card.image,
          stock: card.stock,
        },
        1,
      );

      if (firstAddedId === null) firstAddedId = card.id;
      added += 1;
    }

    setAddingAll(false);

    if (added === 0) {
      toast.error("Nothing on this list is in stock right now.");
      return;
    }

    if (firstAddedId !== null) markAdded(firstAddedId);
    openDrawer();
  }

  if (!hydrated) {
    return (
      <div className="py-20 text-center">
        <p className="text-[0.9375rem] text-ink/50">Opening your wishlist&hellip;</p>
      </div>
    );
  }

  const empty = cards !== null && cards.length === 0;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-ink/10 pb-6">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h1 className="mt-2 text-h2 text-ink">Your wishlist.</h1>
          <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink/60">
            {empty
              ? "Nothing saved yet. Tap a heart on any plant and it will wait for you here."
              : "Anything here can still be bought. We will tell you if that stops being true."}
          </p>
        </div>

        {cards && cards.length > 0 && (
          <Button
            size="lg"
            onClick={addEverything}
            loading={addingAll}
            className={cn("shrink-0")}
          >
            <ShoppingBagIcon aria-hidden="true" />
            Add everything to the basket
          </Button>
        )}
      </div>

      {failed ? (
        <p role="status" className="py-12 text-center text-[0.9375rem] text-forest">
          {failed}
        </p>
      ) : cards === null ? (
        // The grid's own skeleton, at its real column count and card ratio, so the
        // arrival of the cards moves nothing.
        <WishlistSkeleton />
      ) : empty ? (
        <EmptyWishlist />
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          <AnimatePresence initial={false}>
            {cards.map((card) => (
              <motion.li
                key={card.id}
                layout={reduceMotion ? false : "position"}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, scale: 0.94, transition: { duration: 0.25 } }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <ProductCard product={card} />

                {/* Removal lives here rather than only on the heart, because a card
                    in a grid of twelve is not a reliable place to find one control.
                    It is a text link, so the 44px minimum is met with padding and
                    it reads as the quiet secondary action it is. */}
                <button
                  type="button"
                  onClick={() => unsave(card.id)}
                  className="mt-3 min-h-11 rounded-md text-[0.8125rem] text-ink/55 underline-offset-4 transition-colors duration-200 hover:text-forest hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Remove {card.name} from wishlist
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}

/**
 * Loading, at the real dimensions.
 *
 * Four columns of a 4:5 card is the tallest thing on the page, so the skeleton has
 * to be the same height or the cards will jump as they arrive.
 */
function WishlistSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((card) => (
        <li key={card}>
          <div className="aspect-[4/5] rounded-lg bg-ink/[0.07]" />
          <div className="mt-3 h-3 w-20 rounded bg-ink/[0.07]" />
          <div className="mt-2 h-4 w-4/5 rounded bg-ink/[0.07]" />
          <div className="mt-2 h-4 w-16 rounded bg-ink/[0.07]" />
        </li>
      ))}
    </ul>
  );
}

function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <svg
        viewBox="0 0 96 88"
        role="img"
        aria-label="An empty pot with a heart where the plant would be"
        className="h-24 w-auto text-forest/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M28 44h40l-3 26a4 4 0 0 1-4 3.5H35a4 4 0 0 1-4-3.5Z" />
        <path d="M24 38h48v6H24z" opacity="0.6" />
        <path d="M48 38v-6" />
        <path
          d="M48 25.5c-2-3-5-4.5-5-8a5 5 0 0 1 10 0c0 3.5-3 5-5 8Z"
          opacity="0.75"
        />
      </svg>

      <p className="mt-6 font-heading text-xl font-semibold tracking-[-0.02em] text-ink">
        Nothing saved yet
      </p>

      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink/60">
        Tap the heart on any plant and it will wait here — across visits, and across
        devices once you are signed in.
      </p>

      <Button nativeButton={false} render={<Link href="/shop" />} size="lg" className="mt-6">
        Go and find one
      </Button>
    </div>
  );
}
