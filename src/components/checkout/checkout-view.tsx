"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRightIcon,
  CircleAlertIcon,
  LockIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "lucide-react";

import {
  priceCart,
  revalidateCart,
  type CartSummary,
} from "@/app/actions/cart";
import {
  createOrderAction,
  type StockIssue,
} from "@/app/actions/checkout";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { CheckoutSection } from "@/components/checkout/checkout-section";
import { PaymentMethods } from "@/components/checkout/checkout-payment-methods";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatPrice, getDeliveryWindow } from "@/lib/utils";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/validations/checkout";
import { useCartStore } from "@/store/cart";

import { cn } from "cn";

/**
 * The interactive checkout: numbered sections, the basket summary, and the
 * place-order action.
 *
 * The form is deliberately lenient to read and strict to submit. Sections
 * validate as the shopper moves through them, but the only moment money is
 * actually moved is `createOrderAction`, which re-fetches every product and
 * recomputes every cent — the client basket here is display furniture, the
 * database is the truth. That split is why the totals on this page come from
 * `priceCart` rather than the badge numbers sitting in localStorage.
 */

export type CheckoutSavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type CustomerProfile = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

const SECTION_FIELDS: ReadonlyArray<ReadonlyArray<keyof CheckoutFormValues>> = [
  ["email", "phone"],
  ["fullName", "line1", "line2", "city", "state", "postalCode", "country"],
  [],
  ["paymentMethod"],
];

const SECTION_META = [
  { title: "Contact", eyebrow: "Where the receipt lands" },
  { title: "Shipping address", eyebrow: "Where the plants arrive" },
  { title: "Delivery", eyebrow: "How they travel" },
  { title: "Payment", eyebrow: "Cash on delivery, or card now" },
] as const;

const FIELD_IDS: Record<keyof CheckoutFormValues, string> = {
  email: "checkout-email",
  phone: "checkout-phone",
  fullName: "checkout-fullName",
  line1: "checkout-line1",
  line2: "checkout-line2",
  city: "checkout-city",
  state: "checkout-state",
  postalCode: "checkout-postalCode",
  country: "checkout-country",
  paymentMethod: "checkout-paymentMethod",
};

export function CheckoutView({
  customer,
  savedAddresses,
  stripeAvailable,
  settings,
}: {
  customer: CustomerProfile | null;
  savedAddresses: CheckoutSavedAddress[];
  stripeAvailable: boolean;
  settings: {
    shippingFeeLabel: string;
    contactEmail: string;
    contactPhone: string;
  };
}) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const replaceItems = useCartStore((state) => state.replaceItems);

  const loggedIn = Boolean(customer?.email);

  const defaultAddress = useMemo(
    () =>
      savedAddresses.find((address) => address.isDefault) ??
      savedAddresses[0] ??
      null,
    [savedAddresses],
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      email: customer?.email ?? "",
      phone: defaultAddress?.phone ?? customer?.phone ?? "",
      fullName: defaultAddress?.fullName ?? customer?.name ?? "",
      line1: defaultAddress?.line1 ?? "",
      line2: defaultAddress?.line2 ?? "",
      city: defaultAddress?.city ?? "",
      state: defaultAddress?.state ?? "",
      postalCode: defaultAddress?.postalCode ?? "",
      country: defaultAddress?.country ?? "US",
      paymentMethod: "COD",
    },
  });

  const { handleSubmit, register, trigger, setValue, getValues, formState } =
    form;
  const { errors } = formState;
  const paymentMethod = form.watch("paymentMethod");

  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [pricing, setPricing] = useState(true);
  const [banner, setBanner] = useState<{
    message: string;
    issues: StockIssue[];
  } | null>(null);
  const [placePending, setPlacePending] = useState(false);
  const [keepAddress, setKeepAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress?.id ?? "new",
  );
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const bannerRef = useRef<HTMLDivElement | null>(null);
  const checkoutToken = useRef<string | null>(null);
  const arrivalChecked = useRef(false);
  const redirected = useRef(false);
  const mounted = useRef(false);
  const deliveryWindow = useMemo(() => getDeliveryWindow(), []);

  // Arrival: ask the database what the basket is actually worth and fix the
  // client copy, exactly like the cart page does before showing a total.
  useEffect(() => {
    if (!hydrated || arrivalChecked.current) return;
    arrivalChecked.current = true;
    let cancelled = false;

    void revalidateCart({ items })
      .then((result) => {
        if (cancelled || !result.success) return;
        replaceItems(result.lines);
      })
      .catch(() => {
        // The basket keeps its numbers; the totals row will still refuse to
        // show a price until a successful reprice below.
      });

    return () => {
      cancelled = true;
    };
  }, [hydrated, items, replaceItems]);

  // An empty basket has no business on a checkout form.
  useEffect(() => {
    if (!hydrated || redirected.current) return;
    if (items.length === 0) {
      redirected.current = true;
      toast("Your basket is empty.", {
        description: "Pick out a plant or two, then come back to check out.",
      });
      router.replace("/cart");
    }
  }, [hydrated, items, router]);

  // Authoritative totals, debounced against the keystroke that changed them.
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    setPricing(true);

    const timer = window.setTimeout(() => {
      // `calculateTotals` treats the id list as one entry per unit — repeated
      // ids collapse into a quantity — so each `productId` appears once per
      // item the basket holds.
      const expandedIds = items.flatMap((item) =>
        Array.from({ length: item.quantity }, () => item.productId),
      );
      void priceCart({
        productIds: expandedIds,
        promoCode: promoCode ?? null,
      })
        .then((result) => {
          if (result.success) setSummary(result.summary);
          setPricing(false);
        })
        .catch(() => setPricing(false));
    }, 160);

    return () => window.clearTimeout(timer);
  }, [hydrated, items, promoCode]);

  // Focus the first field of a section the moment it becomes active — except
  // the very first paint, where the keyboard should stay in the pocket.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const firstField = SECTION_FIELDS[activeSection][0];
    if (firstField) {
      window.setTimeout(() => {
        document.getElementById(FIELD_IDS[firstField])?.focus();
      }, 0);
    }
  }, [activeSection]);

  function sectionStatus(index: number): "active" | "complete" | "idle" {
    if (index === activeSection) return "active";
    if (completedSections[index]) return "complete";
    return "idle";
  }

  function reopenSection(index: number) {
    setBanner(null);
    setActiveSection(index);
  }

  async function advance() {
    const fields = SECTION_FIELDS[activeSection];

    if (fields.length > 0) {
      const valid = await trigger([...fields]);
      if (!valid) return;
    }

    setCompletedSections((previous) => {
      const next = [...previous];
      next[activeSection] = true;
      return next;
    });

    if (activeSection + 1 < SECTION_META.length) {
      setActiveSection(activeSection + 1);
    }
  }

  function applySavedAddress(address: CheckoutSavedAddress) {
    setSelectedAddressId(address.id);
    setValue("fullName", address.fullName, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("phone", address.phone, { shouldValidate: true, shouldDirty: true });
    setValue("line1", address.line1, { shouldValidate: true, shouldDirty: true });
    setValue("line2", address.line2 ?? "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("city", address.city, { shouldValidate: true, shouldDirty: true });
    setValue("state", address.state, { shouldValidate: true, shouldDirty: true });
    setValue("postalCode", address.postalCode, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("country", address.country, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function handleFieldKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void advance();
    }
  }

  function showBanner(message: string, issues: StockIssue[] = []) {
    setBanner({ message, issues });
    window.setTimeout(() => bannerRef.current?.focus(), 0);
  }

  function onInvalid(invalid: FieldErrors<CheckoutFormValues>) {
    const firstInvalidIndex = SECTION_FIELDS.findIndex((fields) =>
      fields.some((name) => invalid[name]),
    );
    if (firstInvalidIndex >= 0 && firstInvalidIndex !== activeSection) {
      setActiveSection(firstInvalidIndex);
    }
  }

  async function onPlace(values: CheckoutFormValues) {
    if (placePending || !summary || items.length === 0) return;
    setBanner(null);
    setPlacePending(true);
    checkoutToken.current ??= crypto.randomUUID();

    const input = {
      email: values.email,
      paymentMethod: values.paymentMethod,
      promoCode: promoCode ?? "",
      saveAddress: loggedIn && keepAddress,
      checkoutToken: checkoutToken.current,
      shipping: {
        fullName: values.fullName,
        phone: values.phone,
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
      },
      lines: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      const result = await Promise.race([
        createOrderAction(input),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("timeout")), 45_000),
        ),
      ]);

      if (!result.success) {
        setPlacePending(false);
        showBanner(result.error, result.stockIssues);
        return;
      }

      // A card order hands off to Stripe's own origin; the basket stays put
      // and the confirmation page clears it once the payment really lands.
      if (result.stripeUrl) {
        window.location.assign(result.stripeUrl);
        return;
      }

      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch {
      setPlacePending(false);
      showBanner(
        "We couldn't finish placing your order just now. Nothing was charged and your basket is still here — try again.",
      );
    }
  }

  const shippingSummary = (() => {
    const values = getValues();
    const line2 = values.line2 ? `, ${values.line2}` : "";
    return [
      values.fullName,
      values.line1 + line2,
      `${values.city}${values.state ? `, ${values.state}` : ""} ${
        values.postalCode
      }`.trim(),
    ]
      .filter(Boolean)
      .join(" · ");
  })();

  // While the basket is still being read out of localStorage, render nothing —
  // the route's own `loading.tsx` already holds the first paint.
  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white px-6 py-12 text-center sm:px-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-mint text-forest">
          <ShoppingBagIcon aria-hidden="true" strokeWidth={1.5} className="size-6" />
        </span>
        <h2 className="mt-4 font-heading text-2xl font-bold tracking-[-0.01em] text-ink">
          Your basket is empty.
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-small leading-relaxed text-ink/60">
          We're sending you back to it — or choose a plant and start again from
          here.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/shop"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  const freeShippingNote = summary
    ? summary.freeShippingRemainingCents > 0
      ? `You're ${formatPrice(
          summary.freeShippingRemainingCents,
        )} away from free shipping.`
      : "Your order ships free."
    : null;

  const placeOrderButton = (className?: string) => (
    <Button
      type="submit"
      form="checkout-form"
      size="lg"
      className={className}
      disabled={!summary || placePending}
      loading={placePending}
    >
      {placePending ? "Placing your order…" : "Place order"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-14">
      {/* Summary column. Kept outside the <form> so the promo input's own form
          cannot nest inside it; the button still reaches in via `form=` above. */}
      <div className="order-first w-full lg:order-2">
        <CheckoutOrderSummary
          items={items}
          summary={summary}
          pricing={pricing}
          promoCode={promoCode}
          onPromoApply={(code) => setPromoCode(code)}
          onPromoClear={() => setPromoCode(null)}
          paymentMethod={paymentMethod}
          mobileExpanded={mobileSummaryOpen}
          onMobileToggle={() => setMobileSummaryOpen((open) => !open)}
          footer={placeOrderButton("hidden w-full lg:inline-flex")}
        />
      </div>

      <form
        id="checkout-form"
        noValidate
        onSubmit={handleSubmit(onPlace, onInvalid)}
        className="order-last w-full min-w-0 space-y-5 lg:order-1"
      >
        {banner ? (
          <div
            ref={bannerRef}
            tabIndex={-1}
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4 outline-none"
          >
            <CircleAlertIcon
              aria-hidden="true"
              strokeWidth={1.75}
              className="mt-0.5 size-5 shrink-0 text-destructive"
            />
            <div className="min-w-0 text-small leading-relaxed text-ink">
              <p className="font-semibold text-ink">{banner.message}</p>
              {banner.issues.length > 0 ? (
                <>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                    {banner.issues.map((issue) => (
                      <li key={issue.productId}>
                        {issue.name} — {issue.requested} in your basket,{" "}
                        {issue.available} on the shelf.
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/cart"
                    className="mt-2 inline-flex items-center gap-1 font-medium text-forest underline underline-offset-4 hover:text-leaf"
                  >
                    Review your basket
                    <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 1 — Contact */}
        <CheckoutSection
          index={1}
          title={SECTION_META[0].title}
          eyebrow={SECTION_META[0].eyebrow}
          status={sectionStatus(0)}
          summary={`${getValues("email") || "No email yet"} · ${
            getValues("phone") || "no phone yet"
          }`}
          onEdit={() => reopenSection(0)}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor={FIELD_IDS.email}>Email</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id={FIELD_IDS.email}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    onKeyDown={handleFieldKeyDown}
                    {...register("email")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.email)}>
                {errors.email?.message}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor={FIELD_IDS.phone}>Phone</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id={FIELD_IDS.phone}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="(503) 555-0148"
                    onKeyDown={handleFieldKeyDown}
                    {...register("phone")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.phone)}>
                {errors.phone?.message}
              </AnimatedFieldError>
            </Field>

            <p className="text-small leading-relaxed text-ink/55 sm:col-span-2">
              We use these only to talk about your order — the phone number is
              for the driver.
            </p>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              onClick={() => void advance()}
              className="w-full sm:w-auto"
            >
              Continue
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </CheckoutSection>

        {/* 2 — Shipping address */}
        <CheckoutSection
          index={2}
          title={SECTION_META[1].title}
          eyebrow={SECTION_META[1].eyebrow}
          status={sectionStatus(1)}
          summary={shippingSummary || undefined}
          onEdit={() => reopenSection(1)}
        >
          {loggedIn && savedAddresses.length > 0 ? (
            <div className="mb-6">
              <p className="text-small font-medium text-ink">Ship to</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {savedAddresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => applySavedAddress(address)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-small font-medium transition-colors duration-200",
                      selectedAddressId === address.id
                        ? "border-forest bg-mint/50 text-forest"
                        : "border-ink/15 text-ink/70 hover:border-ink/30 hover:text-ink",
                    )}
                  >
                    {address.fullName} · {address.city}, {address.state}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAddressId("new")}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-small font-medium transition-colors duration-200",
                    selectedAddressId === "new"
                      ? "border-forest bg-mint/50 text-forest"
                      : "border-ink/15 text-ink/70 hover:border-ink/30 hover:text-ink",
                  )}
                >
                  A new address
                </button>
              </div>
            </div>
          ) : null}

          <AddressFields
            register={register}
            errors={errors}
            onKeyDown={handleFieldKeyDown}
          />

          {loggedIn ? (
            <label className="mt-6 flex cursor-pointer items-center gap-3 text-small text-ink/70">
              <input
                type="checkbox"
                checked={keepAddress}
                onChange={(event) => setKeepAddress(event.target.checked)}
                className="size-4 accent-forest"
              />
              Save this address for next time
            </label>
          ) : null}

          <div className="mt-6">
            <Button
              type="button"
              onClick={() => void advance()}
              className="w-full sm:w-auto"
            >
              Continue to delivery
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </CheckoutSection>

        {/* 3 — Delivery */}
        <CheckoutSection
          index={3}
          title={SECTION_META[2].title}
          eyebrow={SECTION_META[2].eyebrow}
          status={sectionStatus(2)}
          summary={`Standard · arrives ${deliveryWindow.label}`}
          onEdit={() => reopenSection(2)}
        >
          <div className="rounded-xl bg-mint/40 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <TruckIcon
                aria-hidden="true"
                strokeWidth={1.5}
                className="mt-0.5 size-5 shrink-0 text-forest"
              />
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  Standard delivery — {settings.shippingFeeLabel}
                </p>
                <p className="mt-1 text-small leading-relaxed text-ink/65">
                  Orders leave the nursery within a working day and arrive{" "}
                  {deliveryWindow.label}. Plants travel in reinforced boxes,
                  roots wrapped and snug.
                </p>
                {freeShippingNote ? (
                  <p className="mt-1.5 text-small font-medium text-forest">
                    {freeShippingNote}
                  </p>
                ) : null}
                <p className="mt-2 text-small leading-relaxed text-ink/55">
                  Questions about an order? Email{" "}
                  <span className="font-medium text-ink/75">
                    {settings.contactEmail}
                  </span>{" "}
                  or call {settings.contactPhone}.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              onClick={() => void advance()}
              className="w-full sm:w-auto"
            >
              Continue to payment
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </CheckoutSection>

        {/* 4 — Payment */}
        <CheckoutSection
          index={4}
          title={SECTION_META[3].title}
          eyebrow={SECTION_META[3].eyebrow}
          status={sectionStatus(3)}
          summary={PAYMENT_METHOD_LABELS[paymentMethod]}
          onEdit={() => reopenSection(3)}
        >
          <PaymentMethods
            value={paymentMethod}
            onChange={(value) =>
              setValue("paymentMethod", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            stripeAvailable={stripeAvailable}
          />
        </CheckoutSection>

        {/* Mobile CTA, full width, exactly one per screen size. */}
        <div className="pt-1 lg:hidden">
          {placeOrderButton("w-full")}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-small text-ink/55">
            <LockIcon
              aria-hidden="true"
              strokeWidth={2}
              className="size-3.5"
            />
            Secure checkout
          </p>
        </div>
      </form>
    </div>
  );
}

/**
 * The shipping fields, shared by the checkout and (via its own wrapper) the
 * address book, so both validate the same nine fields the same way.
 */
function AddressFields({
  register,
  errors,
  onKeyDown,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const fields: Array<{
    name: keyof CheckoutFormValues;
    label: string;
    type?: string;
    autoComplete: string;
    inputMode?: "text" | "tel" | "numeric";
    placeholder?: string;
    className?: string;
  }> = [
    {
      name: "fullName",
      label: "Full name",
      autoComplete: "shipping name",
      placeholder: "Alex Rivera",
      className: "sm:col-span-2",
    },
    {
      name: "line1",
      label: "Street address",
      autoComplete: "shipping address-line1",
      placeholder: "12 Kiln Lane",
      className: "sm:col-span-2",
    },
    {
      name: "line2",
      label: "Apartment, suite (optional)",
      autoComplete: "shipping address-line2",
      className: "sm:col-span-2",
    },
    { name: "city", label: "City", autoComplete: "shipping address-level2" },
    {
      name: "state",
      label: "State",
      autoComplete: "shipping address-level1",
      placeholder: "OR",
    },
    {
      name: "postalCode",
      label: "ZIP",
      autoComplete: "shipping postal-code",
      inputMode: "numeric",
    },
    {
      name: "country",
      label: "Country",
      autoComplete: "shipping country",
      placeholder: "United States",
      className: "sm:col-span-2",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map(({ name, label, type, autoComplete, inputMode, placeholder, className }) => (
        <Field key={name} invalid={Boolean(errors[name])} className={className}>
          <FieldLabel htmlFor={FIELD_IDS[name]}>{label}</FieldLabel>
          <FieldControl
            render={
              <Input
                id={FIELD_IDS[name]}
                type={type ?? "text"}
                autoComplete={autoComplete}
                inputMode={inputMode}
                placeholder={placeholder}
                onKeyDown={onKeyDown}
                {...register(name)}
              />
            }
          />
          <AnimatedFieldError show={Boolean(errors[name])}>
            {errors[name]?.message}
          </AnimatedFieldError>
        </Field>
      ))}
    </div>
  );
}