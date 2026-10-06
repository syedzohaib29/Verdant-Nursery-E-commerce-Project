import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, HeartIcon, MapPinIcon, PackageIcon } from "lucide-react";

import { auth } from "@/auth";
import { getAccountOverview } from "@/lib/data/account";
import { OrderCard } from "@/components/account/order-card";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Overview",
};

/**
 * The landing page of the account.
 *
 * The numbers up top are the three things a returning customer actually asks for,
 * and each one is a link to where the answer lives in full. The recent orders
 * below do the rest of the work: this page exists to answer "where is my plant"
 * with one glance, not to be a form.
 */
export default async function AccountOverviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  const overview = await getAccountOverview(session.user.id);

  if (!overview) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  const firstName = overview.name.trim().split(/\s+/)[0] ?? "there";

  const stats = [
    {
      href: "/account/orders",
      label: "Orders",
      value: overview.orderCount,
      icon: PackageIcon,
    },
    {
      href: "/wishlist",
      label: "Saved plants",
      value: overview.wishlistCount,
      icon: HeartIcon,
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      value: overview.addressCount,
      icon: MapPinIcon,
    },
  ] as const;

  return (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="mt-3 text-h2 text-ink">Welcome back, {firstName}.</h1>
      <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink/60">
        A member since {overview.memberSinceLabel}. Everything your order needs is
        two clicks away.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="group flex items-center gap-4 rounded-xl border border-ink/10 bg-white p-5 outline-none transition-colors duration-200 ease-verdant hover:border-forest/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:block"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint text-forest sm:size-9">
              <stat.icon aria-hidden="true" strokeWidth={1.75} className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-[1.375rem] leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {stat.value}
              </span>
              <span className="mt-1.5 block text-small text-text-muted">
                {stat.label}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-[1.375rem] font-semibold tracking-[-0.02em] text-ink">
              Recent orders
            </h2>
            <p className="mt-1 text-small text-text-muted">
              The last three, newest first.
            </p>
          </div>

          {overview.orderCount > 3 && (
            <Link
              href="/account/orders"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg text-small font-medium text-forest outline-none underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              All {overview.orderCount}
              <ArrowRightIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
            </Link>
          )}
        </div>

        {overview.latestOrders.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-ink/20 bg-white/60 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-ink">
              Nothing to track yet.
            </p>
            <p className="mx-auto mt-2 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink/60">
              When your first order leaves the nursery it will show up here with a
              status you can actually follow.
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
          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overview.latestOrders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}