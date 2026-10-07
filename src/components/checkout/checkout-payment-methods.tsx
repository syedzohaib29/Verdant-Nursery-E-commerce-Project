"use client";

import { BanknoteIcon, CreditCardIcon } from "lucide-react";

import { type PaymentMethod } from "@/lib/constants";

import { cn } from "cn";

type PaymentOption = {
  value: PaymentMethod;
  title: string;
  note: string;
  Icon: typeof BanknoteIcon;
};

/**
 * How the order gets paid.
 *
 * Two real cards made of real radios (visually hidden, keyboard-focusable), so
 * the selected one is a native checked input, not a div pretending. The card
 * order is deliberate: cash on delivery is always offered, and card only when
 * the shop is actually wired for Stripe — a credit card offer that cannot
 * possibly be used is a broken promise in the middle of the last step.
 */
export function PaymentMethods({
  value,
  onChange,
  stripeAvailable,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  stripeAvailable: boolean;
}) {
  const options: PaymentOption[] = [
    {
      value: "COD",
      title: "Cash on delivery",
      note: "Nothing is charged today. You settle with the driver when the plants arrive.",
      Icon: BanknoteIcon,
    },
    ...(stripeAvailable
      ? [
          {
            value: "STRIPE" as const,
            title: "Card — test mode",
            note: "You finish on Stripe's secure page. Test card: 4242 4242 4242 4242.",
            Icon: CreditCardIcon,
          },
        ]
      : []),
  ];

  return (
    <fieldset>
      <legend className="sr-only">Payment method</legend>
      <div className="grid gap-3">
        {options.map(({ value: optionValue, title, note, Icon }) => {
          const selected = value === optionValue;

          return (
            <label
              key={optionValue}
              className={cn(
                "group flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 outline-none transition-colors duration-200 ease-verdant sm:p-5",
                "group-focus-within:outline-2 group-focus-within:outline-offset-2 group-focus-within:outline-ring",
                selected
                  ? "border-forest bg-mint/40"
                  : "border-ink/10 bg-white hover:border-ink/25",
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={optionValue}
                checked={selected}
                onChange={() => onChange(optionValue)}
                className="sr-only"
              />

              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-ink/20 transition-colors duration-200 group-has-[:checked]:border-forest">
                <span
                  className={cn(
                    "size-2 rounded-full bg-forest transition-transform duration-200 ease-verdant",
                    selected ? "scale-100" : "scale-0",
                  )}
                />
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2 text-body font-semibold text-ink">
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-4.5 text-forest"
                  />
                  {title}
                </span>
                <span className="mt-0.5 block text-small leading-relaxed text-ink/60">
                  {note}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}