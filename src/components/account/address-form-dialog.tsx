"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "lucide-react";

import { saveAddressAction } from "@/app/actions/account";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import {
  addressFormSchema,
  type AddressFormInput,
} from "@/lib/validations/address";

import { cn } from "cn";

export type AddressRecord = {
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

/**
 * Places the checkout and the address book both deliver to. Kept modest on
 * purpose: the seed data ships to the US, and a long list is a long scroll for a
 * field most people never change.
 */
const COUNTRIES = [
  "US",
  "CA",
  "GB",
  "AU",
  "NZ",
  "IE",
  "DE",
  "FR",
  "NL",
  "SE",
  "NO",
  "DK",
  "AT",
  "CH",
  "BE",
  "ES",
  "IT",
  "PT",
  "PL",
  "IN",
  "SG",
  "JP",
  "AE",
  "ZA",
  "BR",
  "MX",
] as const;

const EMPTY_ADDRESS: Omit<AddressRecord, "id" | "isDefault"> & {
  line2: string;
} = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

function countryOptions(current: string): string[] {
  const list: string[] = [...COUNTRIES];
  if (!list.includes(current)) list.push(current);
  return list;
}

/**
 * Create or edit one address.
 *
 * The dialog keeps focus management for free: base-ui returns focus to the
 * button that opened it when it closes, and the first field takes it on open.
 * `address === null` means "new" — the key the parent puts on this component
 * remounts the form for every different target, so the fields are always the
 * row being edited, never a carry-over from the last one.
 */
export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: AddressRecord | null;
  onSaved: (address: AddressRecord) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = address !== null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 ?? "",
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        }
      : { ...EMPTY_ADDRESS, isDefault: false },
    mode: "onTouched",
  });

  const country = watch("country");
  const isDefault = watch("isDefault");

  async function onSubmit(values: AddressFormInput) {
    setFormError(null);

    const result = await saveAddressAction({
      ...values,
      id: address?.id,
    });

    if (!result.success || !result.address) {
      setFormError(result.error);
      return;
    }

    reset();
    onSaved(result.address);
  }

  const firstField = (name: keyof AddressFormInput) => ({
    onKeyDown: (event: React.KeyboardEvent) => {
      // Enter moves to the next field instead of submitting, so a fast typer
      // does not close the dialog by accident half way through an address.
      if (event.key === "Enter") event.preventDefault();
    },
    ...register(name),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit address" : "Add an address"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Where this order should go, and the name on the door."
              : "Saved here, one click away at checkout."}
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormAlert message={formError} />

          <div className="sm:col-span-2">
            <Field invalid={Boolean(errors.fullName)}>
              <FieldLabel htmlFor="addr-name">Full name</FieldLabel>
              <FieldControl render={<input id="addr-name" autoFocus className={inputClass} {...firstField("fullName")} />} />
              <AnimatedFieldError show={Boolean(errors.fullName)}>
                {errors.fullName?.message}
              </AnimatedFieldError>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor="addr-phone">Phone</FieldLabel>
              <FieldControl
                render={
                  <input
                    id="addr-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className={inputClass}
                    {...firstField("phone")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.phone)}>
                {errors.phone?.message}
              </AnimatedFieldError>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field invalid={Boolean(errors.line1)}>
              <FieldLabel htmlFor="addr-line1">Address line 1</FieldLabel>
              <FieldControl
                render={<input id="addr-line1" autoComplete="address-line1" className={inputClass} {...firstField("line1")} />}
              />
              <AnimatedFieldError show={Boolean(errors.line1)}>
                {errors.line1?.message}
              </AnimatedFieldError>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field invalid={Boolean(errors.line2)}>
              <FieldLabel htmlFor="addr-line2">
                Address line 2{" "}
                <span className="ml-1 font-normal text-text-muted">(optional)</span>
              </FieldLabel>
              <FieldControl
                render={
                  <input id="addr-line2" autoComplete="address-line2" className={inputClass} {...firstField("line2")} />
                }
              />
              <AnimatedFieldError show={Boolean(errors.line2)}>
                {errors.line2?.message}
              </AnimatedFieldError>
            </Field>
          </div>

          <Field invalid={Boolean(errors.city)}>
            <FieldLabel htmlFor="addr-city">City</FieldLabel>
            <FieldControl
              render={<input id="addr-city" autoComplete="address-level2" className={inputClass} {...firstField("city")} />}
            />
            <AnimatedFieldError show={Boolean(errors.city)}>
              {errors.city?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.state)}>
            <FieldLabel htmlFor="addr-state">State</FieldLabel>
            <FieldControl
              render={<input id="addr-state" autoComplete="address-level1" className={inputClass} {...firstField("state")} />}
            />
            <AnimatedFieldError show={Boolean(errors.state)}>
              {errors.state?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.postalCode)}>
            <FieldLabel htmlFor="addr-zip">Postal code</FieldLabel>
            <FieldControl
              render={
                <input id="addr-zip" autoComplete="postal-code" className={inputClass} {...firstField("postalCode")} />
              }
            />
            <AnimatedFieldError show={Boolean(errors.postalCode)}>
              {errors.postalCode?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.country)}>
            <FieldLabel htmlFor="addr-country">Country</FieldLabel>
            <div className="relative">
              <FieldControl
                render={
                  <select
                    id="addr-country"
                    className={cn(inputClass, "appearance-none pr-10")}
                    {...register("country")}
                  >
                    {countryOptions(country).map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                }
              />
              <ChevronDownIcon
                aria-hidden="true"
                strokeWidth={1.75}
                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink/45"
              />
            </div>
            <AnimatedFieldError show={Boolean(errors.country)}>
              {errors.country?.message}
            </AnimatedFieldError>
          </Field>

          <label
            htmlFor="addr-default"
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 sm:col-span-2"
          >
            <Checkbox
              id="addr-default"
              checked={isDefault}
              onCheckedChange={(checked) => setValue("isDefault", checked === true, { shouldValidate: true })}
            />
            <span className="text-[0.9375rem] text-ink/80">
              Make this my default address
            </span>
          </label>

          <DialogFooter className="mt-2 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Save address" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Matches the Input component's field styling so the native elements line up. */
const inputClass =
  "h-12 w-full min-w-0 rounded-lg border border-ink/15 bg-white px-4 text-body text-ink transition-[color,border-color,background-color] duration-200 ease-verdant outline-none placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive aria-invalid:outline-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-ink/[0.03] disabled:text-ink/45";