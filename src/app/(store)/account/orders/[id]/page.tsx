import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, MapPinIcon } from "lucide-react";

import { auth } from "@/auth";
import { getOrderById } from "@/lib/data/orders";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusStepper } from "@/components/account/order-status-stepper";
import { ReorderButton } from "@/components/account/reorder-button";
import { safeCallbackUrl } from "@/lib/redirects";
import { formatPrice } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/constants";

type Props = PageProps<"/account/orders/[id]">;

export const metadata: Metadata = {
  title: "Order details",
};

/**
 * One order, the way a customer reads it.
 *
 * Everything on this page was fetched through `getOrderById(id, userId)`, so a
 * number that belongs to somebody else's account fails the ownership filter and
 * becomes a 404 rather than a screen full of their plants.
 */
export default async function AccountOrderDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  const { id } = await params;
  const order = await getOrderById(id, session.user.id);

  if (!order) notFound();

  const paymentMethod =
    order.paymentMethod in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]
      : order.paymentMethod;
  const paymentStatus =
    order.paymentStatus in PAYMENT_STATUS_LABELS
      ? PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]
      : order.paymentStatus;
  const canReorder =
    order.status !== "REFUNDED" && order.items.length > 0;

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
        All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <p className="eyebrow">Order details</p>
          <h1 className="mt-3 text-h2 text-ink">{order.orderNumber}</h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/60">
            Placed {order.createdAtLabel} · {paymentMethod} · {paymentStatus}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canReorder && <ReorderButton orderId={order.id} />}
          <OrderStatusBadge status={order.status} className="h-8 px-3" />
        </div>
      </div>

      <OrderStatusStepper status={order.status} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <ul className="divide-y divide-ink/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 p-5">
                {item.image ? (
                  <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-mint">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="4rem"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-16 shrink-0 rounded-lg bg-mint" />
                )}

                <div className="min-w-0 flex-1">
                  {item.productId ? (
                    <Link
                      href={`/shop/${item.productId}`}
                      className="block truncate font-medium text-ink outline-none underline-offset-4 hover:text-forest hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <p className="truncate font-medium text-ink">{item.name}</p>
                  )}
                  <p className="mt-1 text-small text-text-muted">
                    {item.quantity} × {item.priceLabel}
                  </p>
                </div>

                <p className="shrink-0 text-[0.9375rem] font-medium text-ink tabular-nums">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-ink/10 bg-warm-white/70 px-5 py-4 text-[0.9375rem]">
            <div className="flex justify-between gap-4 text-ink/70">
              <span>Subtotal</span>
              <span className="tabular-nums">{order.subtotalLabel}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between gap-4 text-forest">
                <span>Discount</span>
                <span className="tabular-nums">−{order.discountLabel}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 text-ink/70">
              <span>Shipping</span>
              <span className="tabular-nums">{order.shippingLabel}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-ink/10 pt-2 font-semibold text-ink">
              <span>Total</span>
              <span className="tabular-nums">{order.totalLabel}</span>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
              <MapPinIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-forest" />
              Shipping address
            </h2>
            <address className="mt-3 text-[0.9375rem] leading-relaxed text-ink/70 not-italic whitespace-pre-line">
              {order.shippingAddress.formatted}
            </address>
          </section>

          {order.status === "REFUNDED" ? (
            <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-5 text-[0.875rem] leading-relaxed text-destructive">
              This order was refunded in full. If the money has not landed within
              a few days, write to us with the number above.
            </p>
          ) : order.status === "CANCELLED" ? (
            <p className="rounded-xl border border-ink/10 bg-white p-5 text-[0.875rem] leading-relaxed text-ink/70">
              This order was cancelled before payment. Nothing was charged, and if
              you would still like the plants, order again.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}