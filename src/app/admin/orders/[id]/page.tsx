import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  FileTextIcon,
  LeafIcon,
  MapPinIcon,
  TruckIcon,
  UserIcon,
} from "lucide-react";

import { OrderTimeline } from "@/components/admin/order-timeline";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getOrderById } from "@/lib/data/orders";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);

  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

/**
 * One order, worked.
 *
 * The customer's own version of this page explains the order; this version
 * reports it and moves it on. The items and the timeline sit on the left —
 * what was bought, and where the plant is. The customer, the payment, and the
 * actions sit on the right — who to call, how they paid, what to do next.
 *
 * Invalid transitions are hidden rather than disabled: a button that cannot
 * be pressed is a question, and the answer is "this order is not in a state
 * where that move exists".
 */
export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const paymentMethod =
    order.paymentMethod in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]
      : order.paymentMethod;
  const paymentStatus =
    order.paymentStatus in PAYMENT_STATUS_LABELS
      ? PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus]
      : order.paymentStatus;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
        All orders
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="eyebrow">Order</p>
          <h1 className="mt-3 font-heading text-h2 font-semibold tracking-[-0.02em] text-ink tabular-nums">{order.orderNumber}</h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/60">
            Placed {order.createdAtLabel} &middot; {order.customerName ?? order.email}{" "}
            &middot; {order.itemCount} {order.itemCount === 1 ? "plant" : "plants"}{" "}
            &middot; {paymentMethod}
          </p>
        </div>

        <StatusBadge status={order.status} className="h-8 px-3" />
      </header>

      {/* grid-cols-1 (not the implicit auto column) keeps the base layout from
          sizing itself to its widest child on a 360px phone. */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        {/* Left: items + timeline */}
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
            <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-1 sm:px-6">
              <h2 className="font-heading text-base font-semibold tracking-[-0.01em] text-ink">
                What they bought
              </h2>
              <span className="text-xs text-ink/45 tabular-nums">
                {order.items.length} {order.items.length === 1 ? "line" : "lines"}
              </span>
            </div>

            {order.items.length === 0 ? (
              <EmptyState
                icon={LeafIcon}
                title="No lines on this order"
                description="Nothing was added before it was placed."
                className="pb-8"
              />
            ) : (
              <ul className="divide-y divide-ink/10 px-5 sm:px-6">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <span className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-mint sm:w-16">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="4rem"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <LeafIcon
                            aria-hidden="true"
                            strokeWidth={1.75}
                            className="size-4 text-forest"
                          />
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium text-ink">
                        {item.name}
                      </p>
                      <p className="mt-1 text-small text-ink/55 tabular-nums">
                        {item.quantity} &times; {item.priceLabel}
                      </p>
                    </div>

                    <p className="shrink-0 text-[0.9375rem] font-medium text-ink tabular-nums">
                      {formatPrice(item.priceCents * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <dl className="space-y-2 border-t border-ink/10 bg-warm-white/70 px-5 py-4 text-[0.9375rem] sm:px-6">
              <div className="flex justify-between gap-4 text-ink/70">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{order.subtotalLabel}</dd>
              </div>
              {order.discountCents > 0 ? (
                <div className="flex justify-between gap-4 text-forest">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">&minus;{order.discountLabel}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 text-ink/70">
                <dt>Shipping</dt>
                <dd className="tabular-nums">{order.shippingLabel}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-ink/10 pt-2 font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{order.totalLabel}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
            <h2 className="font-heading text-base font-semibold tracking-[-0.01em] text-ink">
              Fulfilment
            </h2>
            <p className="mt-1 text-small text-ink/55">
              Where the order is, and where it can go next.
            </p>
            <div className="mt-5">
              <OrderTimeline order={order} />
            </div>
          </section>
        </div>

        {/* Right: customer, payment, actions */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
              <UserIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-forest" />
              Customer
            </h2>
            <p className="mt-3 text-[0.9375rem] font-medium text-ink">
              {order.customerName ?? "No name given"}
            </p>
            <p className="mt-1 break-all text-small text-ink/60">{order.email}</p>
            <p className="mt-3 text-xs tracking-[0.08em] text-ink/45 uppercase">
              {order.userId ? "Shop account" : "Guest checkout"}
            </p>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
              <MapPinIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-forest" />
              Shipping address
            </h2>
            <address className="mt-3 text-[0.9375rem] leading-relaxed text-ink/70 not-italic whitespace-pre-line">
              {order.shippingAddress.formatted}
            </address>
            {order.shippingAddress.phone ? (
              <p className="mt-3 text-small text-ink/55 tabular-nums">
                {order.shippingAddress.phone}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
              <CreditCardIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-forest" />
              Payment
            </h2>
            <dl className="mt-3 space-y-2 text-[0.9375rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Method</dt>
                <dd className="font-medium text-ink">{paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Status</dt>
                <dd className="font-medium text-ink">{paymentStatus}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
              <TruckIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-forest" />
              Tracking
            </h2>
            {order.trackingNumber ? (
              <p className="mt-3 text-[0.9375rem] font-medium text-ink tabular-nums">
                {order.trackingNumber}
              </p>
            ) : (
              <p className="mt-3 text-small text-ink/55">
                Not on the road yet — no tracking number has been added.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
              <FileTextIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-forest" />
              Invoice
            </h2>
            <p className="mt-3 text-small text-ink/55">
              A printable version, black on white, with no UI chrome around it.
            </p>
            <Link
              href={`/invoice/${order.id}`}
              target="_blank"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-ink/20 px-4 text-sm font-medium text-ink outline-none transition-colors duration-200 hover:border-ink/45 hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Open invoice
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
