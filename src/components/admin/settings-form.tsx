"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { z } from "zod";

import { updateSettingsAction } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/admin/money-input";
import { settingsFormSchema } from "@/lib/validations/admin";
import type { Settings } from "@/lib/data/settings";

/**
 * The store settings form.
 *
 * Grouped into three sections — store info, shipping, and promotions — each
 * with its own save button, because the person changing the shipping fee is
 * not usually the person changing the store name, and one "save everything"
 * button makes them wait on each other.
 *
 * Amounts are entered in dollars with a currency prefix and stored in cents.
 * The inline confirmation (a "Saved" pill that appears next to the button) is
 * the primary feedback; the toast is the backup.
 */

type FormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      storeName: settings.storeName,
      shippingFeeDollars: settings.shippingFeeCents / 100,
      freeShippingThresholdDollars: settings.freeShippingThresholdCents / 100,
      promoEnabled: settings.promoEnabled,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      address: settings.address,
    },
    mode: "onTouched",
  });

  const shippingFeeDollars = watch("shippingFeeDollars");
  const freeShippingThresholdDollars = watch("freeShippingThresholdDollars");

  async function onSubmit(values: FormValues) {
    const result = await updateSettingsAction(values);

    if (!result.success) {
      toast.error(result.error || "Check the form and try again.");
      return;
    }

    toast.success("Settings saved.");
    setSavedSection("all");

    // The inline confirmation clears after a beat, so it reads as a
    // confirmation rather than a permanent state.
    setTimeout(() => setSavedSection(null), 3000);

    reset(values);
    router.refresh();
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      {/* ------------------------------ Store info ----------------------------- */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-ink">
          Store info
        </h2>
        <p className="mt-1 text-small text-ink/55">
          The name on the receipts and the address returns go to.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field invalid={Boolean(errors.storeName)}>
            <FieldLabel htmlFor="set-name">Store name</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="set-name"
                  autoComplete="off"
                  {...register("storeName")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.storeName)}>
              {errors.storeName?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.contactEmail)}>
            <FieldLabel htmlFor="set-email">Contact email</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="set-email"
                  type="email"
                  autoComplete="off"
                  {...register("contactEmail")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.contactEmail)}>
              {errors.contactEmail?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.contactPhone)}>
            <FieldLabel htmlFor="set-phone">Contact phone</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="set-phone"
                  type="tel"
                  autoComplete="off"
                  {...register("contactPhone")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.contactPhone)}>
              {errors.contactPhone?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.address)}>
            <FieldLabel htmlFor="set-address">Return address</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="set-address"
                  autoComplete="off"
                  {...register("address")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.address)}>
              {errors.address?.message}
            </AnimatedFieldError>
          </Field>
        </div>
      </section>

      {/* ------------------------------ Shipping ------------------------------ */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-ink">Shipping</h2>
        <p className="mt-1 text-small text-ink/55">
          What delivery costs and when it is free. Changes appear in the basket
          immediately.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field invalid={Boolean(errors.shippingFeeDollars)}>
            <FieldLabel htmlFor="set-shipping">Shipping fee</FieldLabel>
            <MoneyInput
              id="set-shipping"
              label=""
              value={Math.round(shippingFeeDollars * 100)}
              onChange={(cents) =>
                setValue("shippingFeeDollars", cents == null ? 0 : cents / 100, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <AnimatedFieldError show={Boolean(errors.shippingFeeDollars)}>
              {errors.shippingFeeDollars?.message}
            </AnimatedFieldError>
          </Field>

          <Field
            invalid={
              Boolean(errors.freeShippingThresholdDollars) ||
              freeShippingThresholdDollars <= shippingFeeDollars
            }
          >
            <FieldLabel htmlFor="set-threshold">
              Free shipping over
            </FieldLabel>
            <MoneyInput
              id="set-threshold"
              label=""
              value={Math.round(freeShippingThresholdDollars * 100)}
              onChange={(cents) =>
                setValue(
                  "freeShippingThresholdDollars",
                  cents == null ? 0 : cents / 100,
                  { shouldDirty: true, shouldValidate: true },
                )
              }
              hint="Baskets at or above this amount ship free."
            />
            <AnimatedFieldError
              show={
                Boolean(errors.freeShippingThresholdDollars) ||
                freeShippingThresholdDollars <= shippingFeeDollars
              }
            >
              {errors.freeShippingThresholdDollars?.message ??
                (freeShippingThresholdDollars <= shippingFeeDollars
                  ? "The free-shipping line has to sit above the fee."
                  : null)}
            </AnimatedFieldError>
          </Field>
        </div>
      </section>

      {/* ----------------------------- Promotions ----------------------------- */}
      <section className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-ink">
          Promotions
        </h2>
        <p className="mt-1 text-small text-ink/55">
          Whether promo codes are accepted at checkout.
        </p>

        <div className="mt-5">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-warm-white px-4">
            <input
              type="checkbox"
              className="size-4 rounded border-ink/25 accent-forest"
              {...register("promoEnabled")}
            />
            <span className="text-[0.9375rem] text-ink/80">
              Accept promo codes
            </span>
          </label>
        </div>
      </section>

      {/* ------------------------------ Actions ------------------------------- */}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save settings
        </Button>
        {savedSection ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-mint px-3 py-1 text-xs font-medium text-forest">
            <CheckIcon aria-hidden="true" className="size-3.5" />
            Saved
          </span>
        ) : null}
        {isDirty ? (
          <p className="text-small text-ink/50">You have unsaved changes.</p>
        ) : null}
      </div>
    </form>
  );
}
