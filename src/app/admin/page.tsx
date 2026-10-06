import type { Metadata } from "next";

import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { getPendingReviews } from "@/lib/data/reviews";
import { getOrders } from "@/lib/data/orders";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * The back-office landing page — deliberately a shell.
 *
 * This phase proves the desk is locked and lit: an ADMIN sees the numbers the
 * shop already produces, with the real status language the customers see, so the
 * two sides of the shop cannot disagree about what a "Paid" order is. The
 * management screens themselves (orders, reviews, catalogue, people) are a later
 * phase; nothing here links to a page that does not exist.
 */
export default async function AdminDashboardPage() {
  const [recentOrders, pendingReviews, productCount, statusCounts] =
    await Promise.all([
      getOrders({ limit: 8 }),
      getPendingReviews(6),
      prisma.product.count({ where: { isActive: true } }),
      Promise.all(
        ORDER_STATUSES.map(async (status) => [
          status,
          await prisma.order.count({ where: { status } }),
        ] as const),
      ),
    ]);

  const orderTotal = statusCounts.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div>
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-3 text-h2 text-ink">Good morning, desk.</h1>
      <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink/60">
        The shop from the back. Full management screens arrive in the next
        phase.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active products" value={productCount} />
        <StatCard label="Orders, all time" value={orderTotal} />
        <StatCard label="Awaiting review" value={pendingReviews.length} />
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <p className="text-small text-text-muted">Orders by status</p>
          <ul className="mt-3 space-y-2">
            {statusCounts.map(([status, count]) => (
              <li key={status} className="flex items-center justify-between gap-3">
                <OrderStatusBadge status={status as OrderStatus} />
                <span className="text-[0.9375rem] font-medium text-ink tabular-nums">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <section>
          <h2 className="border-b border-ink/10 pb-3 font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Recent orders
          </h2>

          {recentOrders.length === 0 ? (
            <p className="mt-6 text-text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3.5"
                >
                  <div>
                    <p className="font-medium text-ink">{order.orderNumber}</p>
                    <p className="mt-0.5 text-small text-text-muted">
                      {order.createdAtLabel} · {order.email} · {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[0.9375rem] font-medium text-ink tabular-nums">
                      {order.totalLabel}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="border-b border-ink/10 pb-3 font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Reviews to check
          </h2>

          {pendingReviews.length === 0 ? (
            <p className="mt-6 text-text-muted">
              Nothing waiting. The queue is clean.
            </p>
          ) : (
            <ul className="mt-4 space-y-5">
              {pendingReviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-ink/10 bg-white p-4">
                  <p className="text-[0.9375rem] font-semibold text-ink">
                    {review.title}
                  </p>
                  <p className="mt-1 text-small text-text-muted">
                    on {review.productName} · {review.authorName}
                  </p>
                  <p className="mt-2 line-clamp-3 text-[0.875rem] leading-relaxed text-ink/70">
                    {review.body}
                  </p>
                  <p className="mt-2 text-small text-text-muted">
                    {review.rating} of 5 stars
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <p className="text-small text-text-muted">{label}</p>
      <p className="mt-2 font-heading text-[1.625rem] leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums">
        {value}
      </p>
    </div>
  );
}