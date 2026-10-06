"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * The basket.
 *
 * What lives here is a *local* basket: a list of product ids, how many of each,
 * and a copy of the name, price and photograph so the drawer can draw itself
 * without asking anybody anything. Nothing in this file is trusted for money.
 * The cart page and anything that takes payment re-read every price and every
 * stock level from the database, so editing localStorage changes what is in the
 * basket and never what it costs.
 *
 * Hydration safety, which is the fiddly part:
 *
 * - `skipHydration` stops the middleware from reading localStorage while the
 *   module is being imported, because that import also happens on the server,
 *   where localStorage does not exist. The read is kicked off explicitly below,
 *   in the browser only, before React renders the badge.
 * - `hydrated` stays false until that read finishes, so the server HTML and the
 *   first client render agree and the badge paints nothing at all rather than a
 *   confident zero. A badge that renders 0 and then corrects itself to 7 is worse
 *   than a badge that is briefly absent.
 * - `partialize` keeps `hydrated`, `drawerOpen` and `lastAdded` out of
 *localStorage. Persisting `hydrated: true` would defeat the whole mechanism on
 *   the next load, and restoring a drawer as already-open would skip its
 *   animation on every visit.
 *
 * Cross-tab, which turns out to need more than a `storage` listener:
 *
 * Zustand's persist middleware re-serialises on *every* `setState`, not only the
 * ones that change what it persists. So a second tab that has not yet heard about
 * a change will overwrite the newer basket the moment anything at all nudges its
 * state — opening the drawer is enough. The naive listener then adopts that stale
 * payload, and a plant the customer added in one tab vanishes from the other one in
 * front of them.
 *
 * So the persisted payload carries a `revision`, bumped by every change to `items`
 * and nothing else. A tab that receives a revision it already has, or one lower
 * than its own, knows the write came from a tab that has fallen behind and ignores
 * it — then writes its own state back, because the stale write has already
 * overwritten the stored copy and the next page load would otherwise read it.
 */

/** A single line in the basket. */
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  /** Cents. A display copy; the server decides what is actually charged. */
  priceCents: number;
  image: string | null;
  quantity: number;
  /** Last known stock, used to stop the stepper where the shelf actually ends. */
  stock: number;
};

/** What a caller has to hand over to put something in the basket. */
export type CartItemInput = Omit<CartItem, "quantity">;

/** Nobody is ordering eighty of a plant. Ceiling for a single line. */
export const MAX_LINE_QUANTITY = 99;

export const CART_STORAGE_KEY = "verdant-cart";

type CartState = {
  items: CartItem[];
  /**
   * Counts changes to `items`, and is persisted with them.
   *
   * Not a clock — nothing is compared against wall time, only against each other.
   * Two tabs that each add a plant end up at the same number and the same basket,
   * because the second tab's listener pulls the first tab's change in before it
   * writes; a genuine simultaneous divergence is not something localStorage can
   * resolve and is not worth pretending otherwise.
   */
  revision: number;
  /** True once localStorage has been read. Consumers render nothing until then. */
  hydrated: boolean;
  drawerOpen: boolean;
  /**
   * The product most recently added, with a token that changes on every add. The
   * token is what makes the drawer's highlight replay when the same plant is
   * added twice: without it, `productId` alone would be unchanged and the
   * animation would only ever fire once.
   */
  lastAdded: { productId: string; token: number } | null;
  addItem: (item: CartItemInput, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  /**
   * Overwrite the whole basket with a server-resolved version. This is how
   * `revalidateCart` applies its repairs, and it is deliberately a wholesale
   * replace rather than a patch: a stale price has to be impossible, not merely
   * unlikely.
   */
  replaceItems: (items: CartItem[]) => void;
  clear: () => void;
  markAdded: (productId: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

/**
 * Turns anything into a quantity a basket can hold.
 *
 * This is deliberately paranoid, because the input is not only a number typed
 * into a stepper — it is also whatever is sitting in localStorage after somebody
 * has been in the devtools, and a `NaN` that reaches `priceCents * quantity`
 * turns the whole subtotal into `NaN` with no error anywhere. `Math.round`
 * answers the decimals question, the finite check answers `NaN` and `Infinity`,
 * and the clamp answers everything else.
 */
function toQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;

  return Math.min(Math.max(Math.round(value), 1), MAX_LINE_QUANTITY);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.productId === "string" &&
    // Non-empty, and this is not pedantry. A line with no product id cannot be
    // priced, so `revalidateCart` rejects the *whole* basket's schema rather than
    // one bad line — one hand-edited row would otherwise block the arrival check,
    // and with it the price repairs and the stock caps, for every other line.
    item.productId.trim() !== "" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.priceCents === "number" &&
    Number.isFinite(item.priceCents) &&
    item.priceCents >= 0 &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity >= 1 &&
    typeof item.stock === "number" &&
    Number.isFinite(item.stock)
  );
}

/**
 * Keeps the readable lines and discards everything else.
 *
 * Applied on the way out of localStorage, which is the only place in this file
 * that data arrives unvetted. A hand-edited basket gets quietly repaired instead
 * of throwing on the first render — the worst outcome would be a basket that
 * crashes the drawer on every page of the site until localStorage is cleared by
 * hand.
 */
function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const entry of value) {
    if (!isCartItem(entry) || seen.has(entry.productId)) continue;

    seen.add(entry.productId);

    items.push({
      ...entry,
      // Trimmed rather than accepted as-is, so `seen` and every later lookup agree
      // on one spelling of the id. A name is left alone: it is a display copy, and
      // `replaceItems` overwrites it with the database's the moment the basket is
      // checked, which repairs a blank one for free.
      productId: entry.productId.trim(),
      image: typeof entry.image === "string" ? entry.image : null,
      quantity: toQuantity(entry.quantity),
      stock: Math.max(0, Math.round(entry.stock)),
    });
  }

  return items;
}

/**
 * Clamps against a line's own stock, and never below one.
 *
 * `Math.max(1, stock)` rather than `stock`: a basket line whose product has just
 * sold out should stay in the basket at one so the customer can see what
 * happened, rather than silently vanishing before `revalidateCart` has had a
 * chance to explain it. The server action is what removes it, and it says so.
 */
function clampToStock(quantity: number, stock: number): number {
  return Math.min(toQuantity(quantity), Math.max(1, stock));
}

/**
 * A stored revision, or zero.
 *
 * A payload written before this field existed has no revision, and reads as zero
 * rather than as an error: it is a perfectly good basket, just one that predates
 * the counter. Treating it as zero means it loses to any tab that has written
 * since, which is the right way round.
 */
function toRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  return value;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      revision: 0,
      hydrated: false,
      drawerOpen: false,
      lastAdded: null,

      /**
       * Every write to `items` bumps `revision` alongside it, which is the only
       * thing making the cross-tab guard in the listener below meaningful.
       */
      addItem: (item, quantity = 1) =>
        set((state) => {
          // Nothing to add: the shelf is empty. The buttons that can reach this
          // are disabled already, but a stale card from a cached page can still
          // fire one, and adding a line with nothing behind it would put a
          // permanent $0.00 row in the basket.
          if (!Number.isFinite(item.stock) || item.stock <= 0) return state;

          const existing = state.items.find(
            (line) => line.productId === item.productId,
          );

          if (existing) {
            return {
              items: state.items.map((line) =>
                line.productId === item.productId
                  ? {
                      ...line,
                      // Refresh the cached copy on every add, so a price change
                      // lands the next time somebody buys rather than a visit
                      // later.
                      priceCents: item.priceCents,
                      stock: item.stock,
                      image: item.image,
                      quantity: clampToStock(
                        line.quantity + toQuantity(quantity),
                        item.stock,
                      ),
                    }
                  : line,
              ),
              revision: state.revision + 1,
            };
          }

          return {
            items: [
              ...state.items,
              { ...item, quantity: clampToStock(quantity, item.stock) },
            ],
            revision: state.revision + 1,
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((line) => line.productId !== productId),
          revision: state.revision + 1,
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.productId === productId
              ? { ...line, quantity: clampToStock(quantity, line.stock) }
              : line,
          ),
          revision: state.revision + 1,
        })),

      replaceItems: (items) =>
        set((state) => ({
          items: sanitizeItems(items),
          revision: state.revision + 1,
        })),

      clear: () =>
        set((state) => ({
          items: [],
          lastAdded: null,
          revision: state.revision + 1,
        })),

      markAdded: (productId) =>
        set((state) => ({
          lastAdded: {
            productId,
            token: (state.lastAdded?.token ?? 0) + 1,
          },
        })),

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),

    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        items: state.items,
        revision: state.revision,
      }),
      merge: (persisted, current) => {
        const stored = persisted as
          | { items?: unknown; revision?: unknown }
          | undefined;

        return {
          ...current,
          items: sanitizeItems(stored?.items),
          revision: toRevision(stored?.revision),
        };
      },
      onRehydrateStorage: () => (state) => {
        // Runs on the failure path too. A basket that cannot be read should
        // render as an empty basket, not as a page of skeletons that never
        // resolves.
        useCartStore.setState({
          hydrated: true,
          items: state?.items ?? [],
          revision: toRevision(state?.revision),
        });
      },
    },
  ),
);

/** Units in the basket. The number on the bag. */
export function cartCount(state: Pick<CartState, "items">): number {
  return state.items.reduce((total, line) => total + line.quantity, 0);
}

/** Cents. A preview of the order — the cart page shows the real figure. */
export function cartSubtotalCents(state: Pick<CartState, "items">): number {
  return state.items.reduce(
    (total, line) => total + line.priceCents * line.quantity,
    0
  );
}

/** A line, or undefined. Handy where a caller needs the whole item, not a count. */
export function selectLine(
  state: Pick<CartState, "items">,
  productId: string
): CartItem | undefined {
  return state.items.find((line) => line.productId === productId);
}

/**
 * Whether localStorage has been read yet.
 *
 * Everything that reads the basket goes through this. A component that renders
 * `state.items.length` without it will show an empty basket on the server and a
 * full one a moment later, and React will say so in the console.
 */
export function useHydrated(): boolean {
  return useCartStore((state) => state.hydrated);
}

/**
 * Browser-only wiring, run once when this module is first imported.
 *
 * Two things have to happen here rather than inside a component:
 *
 * 1. The rehydrate call. `skipHydration` is on, so nothing else will do it.
 * 2. The cross-tab listener. `storage` fires in *other* tabs only, which is what
 *    keeps this from being an echo of the tab's own writes.
 *
 * Both are inside a `typeof window` guard because this module is also imported by
 * the server render, where `localStorage` does not exist and adding an event
 * listener to nothing is an error.
 */
if (typeof window !== "undefined") {
  void useCartStore.persist.rehydrate();

  window.addEventListener("storage", (event) => {
    if (event.key !== CART_STORAGE_KEY) return;

    const current = useCartStore.getState();

    // A key removal (`localStorage.clear()`, or devtools) arrives with a null
    // value. Emptiness is the honest reading of that.
    if (event.newValue === null) {
      useCartStore.setState({
        items: [],
        revision: current.revision + 1,
      });
      return;
    }

    let incoming: { items: CartItem[]; revision: number };

    try {
      const parsed: unknown = JSON.parse(event.newValue);
      const stored =
        typeof parsed === "object" && parsed !== null
          ? (parsed as { state?: { items?: unknown; revision?: unknown } })
          : undefined;

      incoming = {
        items: sanitizeItems(stored?.state?.items),
        revision: toRevision(stored?.state?.revision),
      };
    } catch {
      // A value we cannot parse is not a basket. Leaving the current one alone is
      // better than emptying somebody's basket because another tab wrote
      // something unexpected.
      return;
    }

    if (incoming.revision <= current.revision) {
      // A tab that has not caught up with us just overwrote the stored copy with
      // its older one. Ignoring it keeps what is on screen right; writing our own
      // state back fixes the stored copy, so the next page load reads the newer
      // basket rather than the stale one.
      //
      // An empty `set` is deliberate: the persist middleware re-serialises on
      // every `setState`, so this re-asserts what we already hold without
      // touching it.
      useCartStore.setState({});
      return;
    }

    useCartStore.setState({
      items: incoming.items,
      revision: incoming.revision,
    });
  });
}
