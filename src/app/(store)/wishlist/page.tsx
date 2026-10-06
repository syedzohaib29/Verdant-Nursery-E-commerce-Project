import type { Metadata } from "next";

import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "The plants you have saved for later.",
};

/**
 * Saved plants.
 *
 * A server shell around a client view, because the record of what is saved lives in
 * the browser. There is nothing to read here: the page is the same for a guest and
 * for a signed-in customer, and the difference is which store the ids came from.
 */
export default function WishlistPage() {
  return (
    <section className="bg-warm-white py-10 lg:py-14">
      <div className="container-x">
        <WishlistView />
      </div>
    </section>
  );
}
