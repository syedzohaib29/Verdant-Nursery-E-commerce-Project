import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Your basket",
  description:
    "Everything you have picked out, with shipping and any discount worked out from today's prices.",
};

/**
 * The basket.
 *
 * A server component that does almost nothing on purpose. The basket itself lives
 * in the browser — it has to, or it could not survive a refresh or a second tab —
 * so this page exists to greet a signed-in customer by name and to render the
 * client view inside the site's chrome.
 *
 * The name is read here rather than fetched inside `CartView` because `auth()` is
 * server-only, and passing one string across is cheaper than making the whole page
 * dynamic on the client.
 */
export default async function CartPage() {
  const session = await auth();

  return (
    <section className="bg-warm-white py-10 lg:py-14">
      <div className="container-x">
        <CartView customerName={session?.user?.name ?? null} />
      </div>
    </section>
  );
}
