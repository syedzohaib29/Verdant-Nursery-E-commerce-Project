"use client";

import { useState, useTransition } from "react";
import { CircleCheckIcon, CircleXIcon, TagIcon, XIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { applyPromoCode } from "@/app/actions/cart";
import { useCartStore } from "@/store/cart";

import { cn } from "cn";

/**
 * The promo code.
 *
 * Validated by a server action against the basket's *current* subtotal, never
 * against a number the browser supplies — so the discount is worked out from what
 * the plants cost right now.
 *
 * The result is an inline state rather than a toast, and that is a deliberate
 * refusal of the obvious pattern. A discount is part of the thing being entered
 * into, not a notification that happened elsewhere: a toast slides away before the
 * number under it has finished updating, and two customers on the same page see
 * the same toast with different totals. Inline, the code, the outcome and the new
 * figure are all in one place and stay there.
 *
 * With no basket there is nothing to discount, so the field is not rendered at
 * all rather than shown disabled.
 */
export function PromoForm({
  appliedCode,
  onApply,
  onClear,
}: {
  appliedCode: string | null;
  onApply: (code: string) => void;
  onClear: () => void;
}) {
  const items = useCartStore((state) => state.items);
  const reduceMotion = useReducedMotion();

  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** Bumped on success so the confirmation animates again for a second code. */
  const [celebrated, setCelebrated] = useState(0);

  if (appliedCode) {
    return (
      <motion.div
        key={celebrated}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }
        className="mt-5 flex items-center gap-2.5 rounded-lg border border-forest/25 bg-mint px-3.5 py-3"
      >
        <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0 text-forest" />

        <p className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-forest">
          <span className="font-semibold">{appliedCode}</span> applied.
        </p>

        <button
          type="button"
          onClick={() => {
            setError(null);
            onClear();
          }}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-forest transition-colors duration-200 hover:bg-forest/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <XIcon aria-hidden="true" className="size-4" />
          <span className="sr-only">Remove the code {appliedCode}</span>
        </button>
      </motion.div>
    );
  }

  function submit() {
    const code = value.trim();

    if (!code) return;

    setError(null);

    startTransition(async () => {
      const result = await applyPromoCode({
        productIds: items.flatMap((item) =>
          Array.from({ length: item.quantity }, () => item.productId),
        ),
        code,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (!result.quote.valid) {
        // The reason comes from the pricing layer, which knows the difference
        // between "expired" and "spend more" — two messages that would be the same
        // string here and both useless.
        setError(result.quote.reason ?? "That code is not one we can use.");
        return;
      }

      setValue("");
      setCelebrated((count) => count + 1);
      onApply(result.quote.code);
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mt-5"
    >
      <label
        htmlFor="promo-code"
        className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink/75"
      >
        <TagIcon aria-hidden="true" className="size-3.5 text-ink/50" />
        Promo code
      </label>

      <div className="mt-2 flex items-stretch gap-2">
        <input
          id="promo-code"
          name="promo"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="VERDANT10"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "promo-code-error" : undefined}
          className="h-11 min-w-0 flex-1 rounded-lg border border-ink/20 bg-white px-3 text-[0.9375rem] tracking-[0.04em] text-ink uppercase transition-colors duration-200 outline-none placeholder:tracking-normal placeholder:text-ink/30 hover:border-ink/35 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-forest aria-invalid:border-destructive"
        />

        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          className="h-11 shrink-0 rounded-lg bg-forest px-4 text-[0.875rem] font-medium text-white transition-colors duration-200 hover:bg-forest/90 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {pending ? "Checking…" : "Apply"}
        </button>
      </div>

      {/* Reserved height so a rejection does not shove the totals down the card. */}
      <div className="min-h-5 pt-1.5">
        {error && (
          <motion.p
            id="promo-code-error"
            role="alert"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
            }
            className="flex items-start gap-1.5 text-[0.8125rem] leading-snug text-forest"
          >
            <CircleXIcon
              aria-hidden="true"
              className={cn("mt-0.5 size-3.5 shrink-0 text-forest/70")}
            />
            {error}
          </motion.p>
        )}
      </div>
    </form>
  );
}
