import type { Metadata } from "next";
import Image from "next/image";

import { getSettings } from "@/lib/data/settings";
import { formatPrice } from "@/lib/utils";
import type { OrderDetail } from "@/lib/data/orders";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

/**
 * A printable invoice for one order.
 *
 * Black on white, no UI chrome: no sidebar, no top bar, no buttons. The page
 * is designed for the browser's print dialog — what you see is what the
 * customer gets on paper. The store's contact details and the order's lines,
 * totals and shipping address are everything an invoice needs.
 */
export async function Invoice({ order }: { order: OrderDetail }) {
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-6">
          <div>
            <p className="font-heading text-2xl font-bold tracking-[-0.02em]">
              {settings.storeName}
            </p>
            <p className="mt-2 text-sm text-ink/60">{settings.address}</p>
            <p className="mt-1 text-sm text-ink/60">
              {settings.contactEmail}
              {settings.contactPhone ? ` · ${settings.contactPhone}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-lg font-semibold">Invoice</p>
            <p className="mt-1 text-sm text-ink/60">{order.orderNumber}</p>
            <p className="mt-1 text-sm text-ink/60">{order.createdAtLabel}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.1em] text-ink/45 uppercase">
              Bill to
            </p>
            <p className="mt-2 text-sm font-medium">
              {order.customerName ?? order.email}
            </p>
            <p className="mt-1 text-sm text-ink/60">{order.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.1em] text-ink/45 uppercase">
              Ship to
            </p>
            <p className="mt-2 text-sm whitespace-pre-line text-ink/80">
              {order.shippingAddress.formatted}
            </p>
          </div>
        </div>

        {/* Lines */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-ink/20">
              <th className="py-2 text-left font-medium">Item</th>
              <th className="py-2 text-center font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-ink/10">
                <td className="py-2.5 pr-4">
                  <span className="font-medium">{item.name}</span>
                  {item.image ? (
                    <span className="ml-2 inline-block size-8 overflow-hidden rounded align-middle">
                      <Image
                        src={item.image}
                        alt=""
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 text-center tabular-nums">
                  {item.quantity}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatPrice(item.priceCents)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatPrice(item.priceCents * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <dl className="mt-6 flex flex-col gap-1.5 border-t-2 border-ink pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">Subtotal</dt>
            <dd className="tabular-nums">{order.subtotalLabel}</dd>
          </div>
          {order.discountCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink/60">Discount</dt>
              <dd className="tabular-nums">&minus;{order.discountLabel}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-ink/60">Shipping</dt>
            <dd className="tabular-nums">{order.shippingLabel}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-ink/20 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{order.totalLabel}</dd>
          </div>
        </dl>

        {/* Payment */}
        <div className="mt-8 border-t border-ink/10 pt-4 text-sm">
          <p className="text-xs font-medium tracking-[0.1em] text-ink/45 uppercase">
            Payment
          </p>
          <p className="mt-2 text-ink/80">
            {order.paymentMethod === "STRIPE" ? "Card" : "Cash on delivery"} ·{" "}
            {order.paymentStatus === "PAID"
              ? "Paid"
              : order.paymentStatus === "PENDING"
                ? "Not yet paid"
                : order.paymentStatus}
          </p>
          {order.trackingNumber ? (
            <p className="mt-1 text-ink/80">
              Tracking: {order.trackingNumber}
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <p className="mt-12 border-t border-ink/10 pt-4 text-center text-xs text-ink/45">
          Thank you for shopping with {settings.storeName}. Thirty days to tell
          us a plant did not make it.
        </p>
      </div>
    </div>
  );
}
