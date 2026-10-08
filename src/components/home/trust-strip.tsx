import { TrustScroller, type PromiseItem } from "@/components/home/trust-scroller";

/*
  Trust strip.

  Four promises, each one we can be held to, and each one a reason the shop below
  it is worth using. The threshold and the pet-safe count are passed in from the
  database so the free-shipping figure here is the same number the cart charges.

  The list itself lives in `trust-scroller.tsx`: it has to be a client island to
  know how far the strip has been dragged, which is what decides whether the two
  arrows are live. Only the text comes from here — the icons and the scroll state
  cannot cross the server/client boundary as components.
*/
export function TrustStrip({
  freeShippingLabel,
  petSafeCount,
}: {
  freeShippingLabel: string;
  petSafeCount: number;
}) {
  const items: PromiseItem[] = [
    {
      icon: "shield",
      title: "Healthy on arrival",
      body: "Packed with no loose soil. If it turns up damaged we replace it, and you do not have to photograph the evidence.",
    },
    {
      icon: "paw",
      title: "A pet-safe filter that means it",
      body: `${petSafeCount} varieties flagged non-toxic to cats and dogs, checked against our own list rather than a marketing category.`,
      href: "/shop?petSafe=true",
    },
    {
      icon: "truck",
      title: `Free over ${freeShippingLabel}`,
      body: "One flat rate below that, quoted at checkout rather than discovered on the payment screen.",
    },
    {
      icon: "sprout",
      title: "Advice before the sale",
      body: "Tell us about the spot and we will tell you what to skip. It costs us orders and earns them back twice over.",
      href: "/care",
    },
  ];

  return (
    <section aria-label="How we ship and what we promise" className="bg-white">
      <div className="container-x">
        <TrustScroller items={items} />
      </div>
    </section>
  );
}
