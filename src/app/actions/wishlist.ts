"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getProductsByIds, type ProductCard } from "@/lib/data/products";
import {
  addWishlistProduct,
  getWishlistProductIds,
  mergeWishlist,
  removeWishlistProduct,
} from "@/lib/data/users";

/*
  Wishlist server actions.

  The wishlist has two lives. A guest's lives in localStorage and needs nothing
  from this file. A signed-in customer's lives in the database, so it survives a new
  phone and shows up on a laptop that never saw the first one — and that half has
  to be written here.

  Every action resolves the caller from the session and never from its arguments.
  There is no `userId` parameter anywhere in this file, which is the whole reason
  a wishlist cannot be read or rewritten by guessing an id.
*/

export type WishlistResult = {
  success: boolean;
  /** The account's saved ids, for replacing the local store after a merge. */
  ids: string[];
  /** Product cards for the wishlist page. */
  cards: ProductCard[];
  error: string | null;
};

const toggleSchema = z.object({
  productId: z.string().min(1).max(64),
});

const idsSchema = z.object({
  productIds: z.array(z.string().min(1).max(64)).max(200),
});

const GUEST: WishlistResult = { success: true, ids: [], cards: [], error: null };

function failure(error: string): WishlistResult {
  return { success: false, ids: [], cards: [], error };
}

/**
 * Saves or unsaves one product.
 *
 * `saved` is decided by the client, which knows the state the heart is about to
 * draw, and the server obeys it rather than re-deriving intent from a toggle. A
 * toggle would make a double click land on the wrong state every time: both clicks
 * ask for the same thing, and the first one already applied it.
 *
 * A guest gets a success with nothing to do, which is what lets the heart behave
 * identically for both kinds of visitor — the local store has already been updated
 * by the time this runs.
 */
export async function toggleWishlist(input: {
  productId: string;
  saved: boolean;
}): Promise<WishlistResult> {
  const parsed = toggleSchema.safeParse(input);

  if (!parsed.success) return failure("We could not save that plant.");

  const session = await auth();

  if (!session?.user?.id) return GUEST;

  try {
    const result = input.saved
      ? await addWishlistProduct(session.user.id, parsed.data.productId)
      : await removeWishlistProduct(session.user.id, parsed.data.productId);

    if (!result.ok) {
      return failure(result.reason ?? "We could not save that plant.");
    }

    return GUEST;
  } catch {
    return failure("We could not save that plant just now.");
  }
}

/**
 * Folds a guest's local wishlist into their account.
 *
 * Called once, right after a successful sign-in or registration. The reply carries
 * the merged list so the caller can replace its local store with the account's
 * version — which is the point, because a wishlist living in two places shows the
 * customer different things depending on which device they picked up.
 */
export async function mergeGuestWishlist(input: {
  productIds: string[];
}): Promise<WishlistResult> {
  const parsed = idsSchema.safeParse(input);

  if (!parsed.success) return failure("We could not save your wishlist.");

  const session = await auth();

  if (!session?.user?.id) return GUEST;

  try {
    const merged = await mergeWishlist(session.user.id, parsed.data.productIds);

    if (!merged.ok) return failure(merged.reason ?? "We could not save your wishlist.");

    return { success: true, ids: merged.ids, cards: [], error: null };
  } catch {
    return failure("We could not save your wishlist just now.");
  }
}

/**
 * The products behind a list of ids, as cards.
 *
 * The wishlist page calls this with whatever the local store holds, which is one
 * code path for guests and for signed-in customers alike — a signed-in list was
 * copied into that store at sign-in. Ids that no longer resolve are dropped here,
 * so the page never has to decide what a missing product looks like.
 */
export async function getWishlistCards(input: {
  productIds: string[];
}): Promise<WishlistResult> {
  const parsed = idsSchema.safeParse(input);

  if (!parsed.success) return failure("We could not load your wishlist.");

  try {
    const cards = await getProductsByIds(parsed.data.productIds);

    return { success: true, ids: [], cards, error: null };
  } catch {
    return failure("We could not load your wishlist just now.");
  }
}

/**
 * The account's saved ids, oldest first.
 *
 * The counterpart to the merge, for a device that has already synced: the account
 * is the truth, so the browser takes its answer rather than offering its own.
 */
export async function fetchAccountWishlist(): Promise<WishlistResult> {
  const session = await auth();

  if (!session?.user?.id) return GUEST;

  try {
    return { success: true, ids: await getWishlistProductIds(session.user.id), cards: [], error: null };
  } catch {
    return failure("We could not load your wishlist just now.");
  }
}
