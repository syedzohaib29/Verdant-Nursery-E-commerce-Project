import type { Metadata } from "next";

import { auth } from "@/auth";
import { CheckoutView, type CheckoutSavedAddress } from "@/components/checkout/checkout-view";
import { getSettings } from "@/lib/data/settings";
import { getUserWithAddresses } from "@/lib/data/users";
import { stripeAvailable } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Calm, straightforward checkout. Pay on delivery, or by card in test mode — nothing is charged until the end.",
};

/**
 * The checkout.
 *
 * A deliberately thin server component: the session (for the prefilled details
 * and the address book), the settings (for the delivery copy and shipping
 * promises) and whether the shop is wired for cards. Everything interactive —
 * the numbered sections, the totals, the payments — lives in `CheckoutView`,
 * which is where the cart and the money really meet.
 */
export default async function CheckoutPage() {
  const [session, settings] = await Promise.all([auth(), getSettings()]);

  const me = session?.user?.id
    ? await getUserWithAddresses(session.user.id)
    : null;

  const savedAddresses: CheckoutSavedAddress[] =
    me?.addresses.map((address) => ({
      id: address.id,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })) ?? [];

  return (
    <div className="container-x py-10 lg:py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-2 max-w-2xl text-h2 text-ink">
        Almost theirs. Tell us where the plants go.
      </h1>
      <p className="mt-3 max-w-xl text-body text-ink/70">
        We will confirm everything on this page and email you a receipt. Nothing
        is charged until the very end.
      </p>

      <div className="mt-10 lg:mt-14">
        <CheckoutView
          customer={
            me
              ? {
                  name: me.name,
                  email: me.email,
                  phone: me.phone,
                }
              : null
          }
          savedAddresses={savedAddresses}
          stripeAvailable={stripeAvailable()}
          settings={{
            shippingFeeLabel: settings.shippingFeeLabel,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
          }}
        />
      </div>
    </div>
  );
}