import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, LockIcon } from "lucide-react";

import { LeafMark } from "@/components/layout/leaf-mark";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Calm, straightforward checkout. Pay on delivery, or by card in test mode — nothing is charged until the end.",
};

/**
 * The frame around `/checkout` and `/checkout/success`.
 *
 * A checkout is a room, not a shop window: no navbar, no footer, no basket
 * drawer. What replaces them is a compact bar that answers the three questions a
 * customer actually has here — where am I, is this safe, how do I get back to my
 * basket — and nothing else competing with the form. The same route-group trick
 * as `(auth)`: a parent layout cannot decline to render what it owns, so a
 * checkout with its own chrome lives in its own group.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-warm-white">
      <header className="border-b border-ink/10 bg-warm-white">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex min-h-11 items-center gap-2 rounded-lg pr-2 outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LeafMark
              strokeWidth={2}
              className="size-6 text-forest transition-transform duration-300 ease-verdant group-hover:-rotate-6"
            />
            <span className="font-heading text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
              Verdant
            </span>
          </Link>

          <p className="hidden items-center gap-1.5 text-small text-ink/55 sm:flex">
            <LockIcon aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
            Secure checkout
          </p>

          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg pl-1 pr-2 text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeftIcon
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-4"
            />
            Back to basket
          </Link>
        </div>
      </header>

      <main id="content" className="flex-1">
        {children}
      </main>
    </div>
  );
}