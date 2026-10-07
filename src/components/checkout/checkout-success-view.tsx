"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  BoxIcon,
  CheckIcon,
  CopyIcon,
  MapPinIcon,
  RefreshCcwIcon,
  TruckIcon,
} from "lucide-react";

import { SuccessCheckmark } from "@/components/checkout/success-checkmark";
import { buttonVariants } from "@/components/ui/button";
import { type PaymentMethod, type PaymentStatus } from "@/lib/constants";
import { useCartStore } from "@/store/cart";

import { cn } from "cn";

/**
 * What a fresh order looks like on its confirmation page.
 *
 * The order was already written to the database — this page promises, verifies
 * and reassures. It clears the basket exactly once (guarded by a session flag
 * so returning to the page can't empty a basket that has since been refilled),
 * and for Stripe orders still awaiting their webhook it quietly re-asks the
 * server for a fresh copy until the payment shows as confirmed.
 */

export type SuccessOrderItem = {
  name: string;
  priceLabel: string;
  quantity: number;
  image: string | null;
};

export type SuccessOrder = {
  orderNumber: string;
  email: string;
  firstName: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalLabel: string;
  itemCount: number;
  deliveryLabel: string;
  items: SuccessOrderItem[];
};

export function CheckoutSuccessView({
  order,
  isOwner,
  contactEmail,
}: {
  order: SuccessOrder;
  /** True when this page's visitor is the signed-in account that owns it. */
  isOwner: boolean;
  contactEmail: string;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const clear = useCartStore((state) => state.clear);

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? 0 : 0.45,
      delay: reduce ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  const payingByCard =
    order.paymentMethod === "STRIPE";
  const awaitingPayment =
    payingByCard && order.paymentStatus === "PENDING";

  // Clear the basket exactly once per order, and never again in this tab. The
  // moment somebody goes Back from this page, their basket is intact; the
  // checkout's empty-cart guard sends it (and them) home.
  useEffect(() => {
    const key = `verdant-cleared-${order.orderNumber}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      clear();
      window.sessionStorage.setItem(key, "1");
    } catch {
      clear();
    }
  }, [clear, order.orderNumber]);

  // A Stripe order is PENDING until the webhook lands. Re-ask the server every
  // couple of seconds; when the props flip to PAID the effect stops on its own.
  useEffect(() => {
    if (!awaitingPayment) return;
    const timer = window.setTimeout(() => router.refresh(), 2500);
    return () => window.clearTimeout(timer);
  }, [awaitingPayment, router]);

  async function copyOrderNumber() {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be denied; the number stays visible to copy by hand.
    }
  }

  const steps = useMemo(
    () =>
      [
        {
          Icon: BoxIcon,
          title: "Potted & packed",
          body: "Your plants get their travel prep — fresh soil, water, a snug box — within a working day.",
        },
        {
          Icon: TruckIcon,
          title: "On the road",
          body: awaitingPayment
            ? "We're confirming your card payment, then they're off."
            : `They arrive ${order.deliveryLabel}. ${
                order.paymentMethod === "COD"
                  ? "That's when you settle with the driver."
                  : "The courier will text when they're close."
              }`,
        },
        {
          Icon: CheckIcon,
          title: "Settle in",
          body: "Unpack them near the sink, water them, and give them a day or two to take the room in.",
        },
      ] as const,
    [awaitingPayment, order.deliveryLabel, order.paymentMethod],
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="text-center">
        <div className="inline-flex">
          <SuccessCheckmark />
        </div>

        <motion.h1
          {...reveal(0.55)}
          className="mt-5 font-heading text-h2 tracking-[-0.02em] text-ink"
        >
          {awaitingPayment
            ? "Your order is in."
            : `They're yours${order.firstName ? `, ${order.firstName}` : ""}.`}
        </motion.h1>
        <motion.p
          {...reveal(0.7)}
          className="mx-auto mt-3 max-w-md text-body leading-relaxed text-ink/65"
        >
          {awaitingPayment
            ? "We've reserved your plants and are just confirming your card payment — the page updates itself."
            : order.paymentMethod === "COD"
              ? "The nursery is potting it up. You'll pay the driver when it arrives — nothing has been charged."
              : "Your payment has gone through and the nursery is potting it up."}
        </motion.p>
      </div>

      {/* Order number, copyable */}
      <motion.div {...reveal(0.85)} className="mt-8">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void copyOrderNumber()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-body font-medium text-ink outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Order{" "}
            <span className="font-semibold tabular-nums">
              {order.orderNumber}
            </span>
            {copied ? (
              <CheckIcon aria-hidden="true" className="size-4 text-forest" />
            ) : (
              <CopyIcon aria-hidden="true" className="size-4 text-ink/45" />
            )}
            <span className="sr-only">
              {copied ? "Copied" : "Copy order number"}
            </span>
          </button>
        </div>
        <p className="mt-2 text-center text-small text-ink/50">
          A receipt is on its way to {order.email}{" "}
          {order.itemCount === 1
            ? "for your one plant"
            : `for all ${order.itemCount} plants`}.
        </p>
      </motion.div>

      {/* What happens next */}
      <motion.section {...reveal(1.0)} className="mt-12">
        <p className="eyebrow text-center">What happens next</p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map(({ Icon, title, body }, index) => (
            <li
              key={title}
              className="rounded-xl border border-ink/10 bg-white p-5"
            >
              <span className="flex items-center justify-between">
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="size-6 text-forest"
                />
                <span className="font-heading text-3xl font-bold text-ink/10">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-3 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-small leading-relaxed text-ink/65">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* Delivery + payment facts */}
      <motion.div {...reveal(1.15)} className="mt-10 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-mint/40 p-5">
          <MapPinIcon
            aria-hidden="true"
            strokeWidth={1.75}
            className="mt-0.5 size-5 shrink-0 text-forest"
          />
          <div>
            <p className="font-medium text-ink">Arrives between</p>
            <p className="mt-0.5 text-small text-ink/65">
              {order.deliveryLabel}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-mint/40 p-5">
          {order.paymentMethod === "COD" ? (
            <CheckIcon
              aria-hidden="true"
              strokeWidth={1.75}
              className="mt-0.5 size-5 shrink-0 text-forest"
            />
          ) : (
            <RefreshCcwIcon
              aria-hidden="true"
              strokeWidth={1.75}
              className={cn(
                "mt-0.5 size-5 shrink-0 text-forest",
                awaitingPayment && "animate-spin [animation-duration:2.5s]",
              )}
            />
          )}
          <div>
            <p className="font-medium text-ink">
              {order.paymentMethod === "COD"
                ? "Cash on delivery"
                : awaitingPayment
                  ? "Confirming payment"
                  : "Paid by card"}
            </p>
            <p className="mt-0.5 text-small text-ink/65">
              {order.paymentMethod === "COD"
                ? `${order.totalLabel} to the driver.`
                : awaitingPayment
                  ? `${order.totalLabel} reserved — usually a minute.`
                  : `${order.totalLabel} settled.`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* The order itself */}
      <motion.section
        {...reveal(1.3)}
        className="mt-10 rounded-2xl border border-ink/10 bg-white p-5 sm:p-6"
      >
        <p className="eyebrow">Your order</p>
        <ul className="mt-4 space-y-4">
          {order.items.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-mint">
                {item.image ? (
                  <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-[0.625rem] text-forest/70">
                    No photo
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-small font-medium text-ink">
                  {item.name}
                </span>
                <span className="block text-small text-ink/50">
                  {item.quantity} × {item.priceLabel}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-ink/10 pt-4 text-right text-body font-semibold text-ink">
          Total{" "}
          <span className="font-bold tabular-nums">{order.totalLabel}</span>
        </p>
      </motion.section>

      {/* Ways onward */}
      <motion.div
        {...reveal(1.45)}
        className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
      >
        <Link
          href="/shop"
          className={buttonVariants({ size: "lg" })}
        >
          Continue shopping
        </Link>
        {isOwner ? (
          <Link
            href="/account/orders"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View your orders
          </Link>
        ) : null}
      </motion.div>

      <motion.p {...reveal(1.55)} className="mt-6 text-center text-small text-ink/50">
        Something look off? Email {contactEmail} and we'll put it right.
      </motion.p>
    </div>
  );
}