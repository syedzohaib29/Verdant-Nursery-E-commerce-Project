"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateProfileAction } from "@/app/actions/account";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/auth";

/**
 * Name and phone, editable together.
 *
 * The save button is a lie until something is actually different: it stays
 * disabled while the form matches what the server returned, so saving a page you
 * never touched does nothing and says nothing. `defaultValues` pull the fields'
 * starting point from the row the page loaded, and a successful save resets the
 * form to the *returned* profile — so the dirty flag reflects the database, not
 * the last thing typed.
 */
export function ProfileForm({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name, phone: phone ?? "" },
    mode: "onTouched",
  });

  async function onSubmit(values: UpdateProfileInput) {
    setFormError(null);

    const result = await updateProfileAction(values);

    if (!result.success) {
      const nameError = result.fieldErrors.name?.[0];
      const phoneError = result.fieldErrors.phone?.[0];

      if (nameError) setError("name", { message: nameError });
      if (phoneError) setError("phone", { message: phoneError });

      if (!nameError && !phoneError) setFormError(result.error);
      return;
    }

    if (result.profile) {
      reset({ name: result.profile.name, phone: result.profile.phone ?? "" });
    }

    toast.success("Profile saved.");
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormAlert message={formError} />

      <Field invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="profile-name">Name</FieldLabel>
        <FieldControl
          render={
            <Input
              id="profile-name"
              autoComplete="name"
              {...register("name")}
            />
          }
        />
        <AnimatedFieldError show={Boolean(errors.name)}>
          {errors.name?.message}
        </AnimatedFieldError>
      </Field>

      <Field invalid={Boolean(errors.phone)}>
        <FieldLabel htmlFor="profile-phone">
          Phone
          <span className="ml-1 font-normal text-text-muted">(optional)</span>
        </FieldLabel>
        <FieldControl
          render={
            <Input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...register("phone")}
            />
          }
        />
        <AnimatedFieldError show={Boolean(errors.phone)}>
          {errors.phone?.message}
        </AnimatedFieldError>
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
        {isDirty && !isSubmitting && (
          <p className="text-small text-text-muted">You have unsaved changes.</p>
        )}
      </div>
    </form>
  );
}