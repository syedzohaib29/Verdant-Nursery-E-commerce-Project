import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { CheckoutSuccessView } from "@/components/checkout/checkout-success-view";
import { getOrderByNumber } from "@/lib/data/orders";
import { getSettings } from "@/lib/data/settings";
import {
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/constants";
import { ORDER_ACCESS_COOKIE, verifyOrderAccess } from "@/lib/success-token";
import { getDeliveryWindow } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Your Verdant order is confirmed — here's what happens next.",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<Record<string, never>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The confirmation page.
 *
 * "Protected" here means "for the person who placed this order, and nobody
 * who guessed the URL." A signed-in customer proves it by owning the order; a
 * guest proves it with the short-lived signed cookie the checkout handed them —
 * the cookie carries the order number *and* the order email, so having one
 * without the other is not enough. Anything else is a 404, deliberately: the
 * page does not confirm that random order numbers exist.
 */
export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderParam } = await searchParams;
  const orderNumber =
    typeof orderParam === "string" ? orderParam.trim() : "";

  if (!/^VRD-\d{5}$/.test(orderNumber)) notFound();

  const [session, order, settings] = await Promise.all([
    auth(),
    getOrderByNumber(orderNumber),
    getSettings(),
  ]);

  if (!order) notFound();

  const userId = session?.user?.id ?? null;

  if (userId) {
    if (order.userId !== userId) notFound();
  } else {
    const token = (await cookies()).get(ORDER_ACCESS_COOKIE)?.value;
    const payload = verifyOrderAccess(token);
    if (
      !payload ||
      payload.o !== orderNumber ||
      payload.e !== order.email.toLowerCase()
    ) {
      notFound();
    }
  }

  const firstName = order.customerName?.split(" ")[0] ?? null;

  return (
    <div className="container-x py-12 lg:py-16">
      <CheckoutSuccessView
        order={{
          orderNumber: order.orderNumber,
          email: order.email,
          firstName,
          paymentMethod: order.paymentMethod as PaymentMethod,
          paymentStatus: order.paymentStatus as PaymentStatus,
          totalLabel: order.totalLabel,
          itemCount: order.itemCount,
          deliveryLabel: getDeliveryWindow().label,
          items: order.items.map((item) => ({
            name: item.name,
            priceLabel: item.priceLabel,
            quantity: item.quantity,
            image: item.image,
          })),
        }}
        isOwner={Boolean(userId)}
        contactEmail={settings.contactEmail}
      />
    </div>
  );
}