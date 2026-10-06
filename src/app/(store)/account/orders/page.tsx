import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";

import { auth } from "@/auth";
import { getOrders } from "@/lib/data/orders";
import { OrderCard } from "@/components/account/order-card";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Orders",
};

/**
 * Every order, newest first.
 *
 * The list is deliberately read-only: changing anything about an order lives
 * behind each row's detail page, so a scan-and-click is all this page has to do.
 */
export default async function AccountOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  const orders = await getOrders({ userId: session.user.id });

  return (
    <div>
      <p className="eyebrow">Your orders</p>
      <h1 className="mt-3 text-h2 text-ink">Orders.</h1>
      <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink/60">
        Newest first. The number on each card is the one to quote if you write to
        us about a plant.
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-ink/20 bg-white/60 p-8 text-center">
          <p className="font-heading text-lg font-semibold text-ink">
            No orders yet.
          </p>
          <p className="mx-auto mt-2 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink/60">
            The greenhouse is open, and the first order is the one the nursery
            remembers.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-forest px-6 text-[0.9375rem] font-medium text-white outline-none transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Browse the shop
            <ArrowRightIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}