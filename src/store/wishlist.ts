"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Saved plants.
 *
 * A list of product ids, in the order they were saved, persisted to
 * localStorage. For a guest that is the whole story. For a signed-in customer it
 * is a cache: the account's wishlist is copied in on sign-in and every toggle is
 * written back through a server action, so this store stays usable offline and
 * stays correct once the network catches up.
 *
 * The same hydration contract as the basket — `skipHydration`, an explicit
 * rehydrate in the browser, and a `hydrated` flag consumers wait on — because a
 * heart that fills in a moment after the page settles looks broken even when the
 * end state is right.
 *
 * Ids rather than products, on purpose. A saved plant that is later taken off
 * sale has to be able to disappear, and that can only be decided by something
 * that can read the catalogue.
 */

export const WISHLIST_STORAGE_KEY = "verdant-wishlist";

type WishlistState = {
  ids: string[];
  /**
   * The account these ids were last reconciled with, or null while they are purely
   * a guest's.
   *
   * This one field is what makes signing in and staying signed in behave
   * differently, and the difference matters. The first time an account is seen the
   * local list is *merged* into the account — a guest who saved four plants on
   * their phone and then signs in on their laptop expects to still have them. After
   * that, the account is the truth and the local list is overwritten by it. Without
   * this, two devices would ping-pong: remove a plant on one, reload on the other,
   * and the stale copy would put it straight back.
   */
  owner: string | null;
  /**
   * Counts changes to `ids`, and is persisted with them.
   *
   * The same reason as the basket's revision, and it matters more here: this store
   * is written by two different tabs with genuinely different ideas of the truth —
   * a guest tab saving a heart while a signed-in tab holds the account's list.
   * Without a guard, the last of them to write anything at all decides what both
   * of them see.
   */
  revision: number;
  hydrated: boolean;
  /**
   * Optimistic add and remove. Deliberately separate rather than one `toggle`,
   * because the caller has to know which way it went: the server is told
   * `{saved: true|false}` and a rollback has to undo the specific direction that
   * was taken rather than assume.
   */
  add: (productId: string) => void;
  remove: (productId: string) => void;
  /** Replace the whole list, e.g. with the account's list after a sync. */
  replace: (ids: string[]) => void;
  setOwner: (owner: string | null) => void;
  clear: () => void;
};

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string" || entry === "" || seen.has(entry)) continue;

    seen.add(entry);
    ids.push(entry);
  }

  return ids;
}

/** A stored revision, or zero. See the identical helper in `@/store/cart`. */
function toRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  return value;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      owner: null,
      revision: 0,
      hydrated: false,

      add: (productId) =>
        set((state) =>
          state.ids.includes(productId)
            ? state
            : { ids: [...state.ids, productId], revision: state.revision + 1 }
        ),

      remove: (productId) =>
        set((state) => ({
          ids: state.ids.filter((id) => id !== productId),
          revision: state.revision + 1,
        })),

      replace: (ids) =>
        set((state) => ({
          ids: sanitizeIds(ids),
          revision: state.revision + 1,
        })),

      // Not an `ids` change, so not a revision bump: this records *who* the list
      // belongs to rather than changing what is in it, and the cross-tab guard only
      // cares about the list.
      setOwner: (owner) => set({ owner }),

      clear: () =>
        set((state) => ({
          ids: [],
          owner: null,
          revision: state.revision + 1,
        })),
    }),

    {
      name: WISHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        ids: state.ids,
        owner: state.owner,
        revision: state.revision,
      }),
      merge: (persisted, current) => {
        const stored = persisted as
          | { ids?: unknown; owner?: unknown; revision?: unknown }
          | undefined;

        return {
          ...current,
          ids: sanitizeIds(stored?.ids),
          owner: typeof stored?.owner === "string" ? stored.owner : null,
          revision: toRevision(stored?.revision),
        };
      },
      onRehydrateStorage: () => (state) => {
        useWishlistStore.setState({
          hydrated: true,
          ids: state?.ids ?? [],
          owner: state?.owner ?? null,
          revision: toRevision(state?.revision),
        });
      },
    },
  ),
);

/** Whether a product is saved. A boolean, so the default equality check is right. */
export function isWishlisted(
  state: Pick<WishlistState, "ids">,
  productId: string
): boolean {
  return state.ids.includes(productId);
}

/** See `useHydrated` in the basket store: same contract, same reason. */
export function useWishlistHydrated(): boolean {
  return useWishlistStore((state) => state.hydrated);
}

/** The current list, for a server action that has to send it somewhere. */
export function getWishlistIds(): string[] {
  return useWishlistStore.getState().ids;
}

/** Browser-only wiring. See the matching block in `@/store/cart`. */
if (typeof window !== "undefined") {
  void useWishlistStore.persist.rehydrate();

  window.addEventListener("storage", (event) => {
    if (event.key !== WISHLIST_STORAGE_KEY) return;

    const current = useWishlistStore.getState();

    if (event.newValue === null) {
      useWishlistStore.setState({
        ids: [],
        revision: current.revision + 1,
      });
      return;
    }

    let incoming: { ids: string[]; owner: string | null; revision: number };

    try {
      const parsed: unknown = JSON.parse(event.newValue);
      const stored =
        typeof parsed === "object" && parsed !== null
          ? (parsed as {
              state?: { ids?: unknown; owner?: unknown; revision?: unknown };
            })
          : undefined;

      incoming = {
        ids: sanitizeIds(stored?.state?.ids),
        owner:
          typeof stored?.state?.owner === "string" ? stored.state.owner : null,
        revision: toRevision(stored?.state?.revision),
      };
    } catch {
      // Unparseable means "not a wishlist". Leave the visible one alone.
      return;
    }

    if (incoming.revision <= current.revision) {
      // A tab behind us just overwrote the stored list with its older one. Ignore
      // it, and re-assert ours so the next page load reads the newer list.
      useWishlistStore.setState({});
      return;
    }

    useWishlistStore.setState({
      ids: incoming.ids,
      owner: incoming.owner,
      revision: incoming.revision,
    });
  });
}
