"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import {
  fetchAccountWishlist,
  mergeGuestWishlist,
} from "@/app/actions/wishlist";
import { useWishlistStore } from "@/store/wishlist";

/**
 * Keeps the local wishlist and the account's in step.
 *
 * Renders nothing. It exists so the reconciliation happens once per page load
 * rather than being sprinkled through the header, the wishlist page and the sign-in
 * form, each of which would get it slightly wrong.
 *
 * Three transitions, three behaviours:
 *
 * - **Signed in, never synced here** → merge. A guest's local list is folded into
 *   the account and the account's answer replaces the local one.
 * - **Signed in, already synced here** → pull. The account is the truth, so a
 *   removal made on another device has to survive a reload here. Without this,
 *   two devices ping-pong: remove a plant on one, reload on the other, and the
 *   stale local copy puts it straight back.
 * - **Signed out** → forget. Somebody's wishlist should not be left readable in
 *   localStorage on a shared machine, and the ids would otherwise be merged into
 *   whoever signs in next.
 *
 * A ref keyed on the user id means a failed attempt is not retried in a loop, and
 * a different account in the same tab starts a fresh pass.
 */
export function WishlistSync() {
  const { data: session, status } = useSession();

  const hydrated = useWishlistStore((state) => state.hydrated);
  const owner = useWishlistStore((state) => state.owner);
  const ids = useWishlistStore((state) => state.ids);
  const replace = useWishlistStore((state) => state.replace);
  const setOwner = useWishlistStore((state) => state.setOwner);
  const clear = useWishlistStore((state) => state.clear);

  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (status === "unauthenticated") {
      // Nothing to reconcile, and nothing to keep *from an account*. The
      // signed-out view of the world starts with an empty ref, so a guard on
      // it would never fire after a redirect — watch the store instead. A
      // guest's own list (owner null) survives every render; only a list
      // stamped with an account that is no longer present is thrown away.
      // clear() sets owner back to null, and after that this branch stays
      // inert.
      syncedFor.current = null;
      if (owner !== null) {
        clear();
      }

      return;
    }

    if (status !== "authenticated" || !session?.user?.id) return;

    const userId = session.user.id;

    if (syncedFor.current === userId) return;

    syncedFor.current = userId;

    void (async () => {
      const result =
        owner === userId
          ? await fetchAccountWishlist()
          : await mergeGuestWishlist({ productIds: ids });

      if (!result.success) {
        // Not fatal. The local list stands and the next page load tries again —
        // failing a sign-in's wishlist over one flaky request would be worse than
        // a wishlist that is briefly out of step.
        syncedFor.current = null;
        return;
      }

      replace(result.ids);
      setOwner(userId);
    })();
  }, [clear, hydrated, ids, owner, replace, session?.user?.id, setOwner, status]);

  // Rendered as an element rather than called as a function, so it has to be
  // typed as a component. There is nothing to draw.
  return null;
}
