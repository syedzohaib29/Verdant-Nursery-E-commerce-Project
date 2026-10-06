import Link from "next/link";
import {
  PawPrintIcon,
  ShieldCheckIcon,
  SproutIcon,
  TruckIcon,
} from "lucide-react";

import { cn } from "cn";

/*
  Trust strip.

  Four promises, each one we can be held to, and each one a reason the shop below
  it is worth using. The threshold and the pet-safe count are passed in from the
  database so the free-shipping figure here is the same number the cart charges.
*/

export function TrustStrip({
  freeShippingLabel,
  petSafeCount,
}: {
  freeShippingLabel: string;
  petSafeCount: number;
}) {
  const items = [
    {
      icon: ShieldCheckIcon,
      title: "Healthy on arrival",
      body: "Packed with no loose soil. If it turns up damaged we replace it, and you do not have to photograph the evidence.",
      href: null,
    },
    {
      icon: PawPrintIcon,
      title: "A pet-safe filter that means it",
      body: `${petSafeCount} varieties flagged non-toxic to cats and dogs, checked against our own list rather than a marketing category.`,
      href: "/shop?petSafe=true",
    },
    {
      icon: TruckIcon,
      title: `Free over ${freeShippingLabel}`,
      body: "One flat rate below that, quoted at checkout rather than discovered on the payment screen.",
      href: null,
    },
    {
      icon: SproutIcon,
      title: "Advice before the sale",
      body: "Tell us about the spot and we will tell you what to skip. It costs us orders and earns them back twice over.",
      href: "/care",
    },
  ] as const;

  return (
    <section aria-label="How we ship and what we promise" className="bg-white">
      <div className="container-x">
        {/* On a phone this is one horizontal scroller with snap points; from 640px it
            becomes a grid, so nobody is left scrolling sideways on a desktop. */}
        <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.title}
              className={cn(
                "snap-start",
                index > 0 && "pl-5 sm:border-l sm:border-ink/10 sm:pl-8",
              )}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className="group/trust flex h-full w-[15.5rem] flex-col rounded-sm py-6 sm:w-auto"
                >
                  <TrustItemBody {...item} />
                  <span className="mt-3 text-small font-medium text-forest underline-offset-4 group-hover/trust:underline">
                    See how
                  </span>
                </Link>
              ) : (
                <div className="flex h-full w-[15.5rem] flex-col rounded-sm py-6 sm:w-auto">
                  <TrustItemBody {...item} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TrustItemBody({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheckIcon;
  title: string;
  body: string;
}) {
  return (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-forest" strokeWidth={1.75} />
      <span className="mt-4 block text-[0.9375rem] leading-tight font-semibold tracking-[-0.01em] text-ink">
        {title}
      </span>
      <span className="mt-2 block text-small leading-relaxed text-text-muted">
        {body}
      </span>
    </>
  );
}