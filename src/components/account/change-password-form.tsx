"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { changePasswordAction } from "@/app/actions/account";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordControl } from "@/components/auth/password-control";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldLabel,
} from "@/components/ui/field";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/auth";

/**
 * Changing the password, with proof.
 *
 * The server checks the current password against its hash before it lets the new
 * one stand, and the failure is reported on the exact field that was wrong — so
 * the form says "that is not the password we have on file" on the current field
 * rather than admitting part of a sentence on the form. A successful change
 * resets every field and the account's new password works on the next sign-in
 * because the error messages were never about the field contents on the disk.
 */
export function ChangePasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  async function onSubmit(values: ChangePasswordInput) {
    setFormError(null);

    const result = await changePasswordAction(values);

    if (!result.success) {
      const currentError = result.fieldErrors.currentPassword?.[0];
      const newError = result.fieldErrors.newPassword?.[0];
      const confirmError = result.fieldErrors.confirmPassword?.[0];

      if (currentError) setError("currentPassword", { message: currentError });
      if (newError) setError("newPassword", { message: newError });
      if (confirmError) setError("confirmPassword", { message: confirmError });

      if (!currentError && !newError && !confirmError) {
        setFormError(result.error);
      }
      return;
    }

    reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    toast.success("Password updated. Use it next time you sign in.");
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormAlert message={formError} />

      <Field invalid={Boolean(errors.currentPassword)}>
        <FieldLabel htmlFor="pw-current">Current password</FieldLabel>
        <PasswordControl
          id="pw-current"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        <AnimatedFieldError show={Boolean(errors.currentPassword)}>
          {errors.currentPassword?.message}
        </AnimatedFieldError>
      </Field>

      <Field invalid={Boolean(errors.newPassword)}>
        <FieldLabel htmlFor="pw-new">New password</FieldLabel>
        <PasswordControl
          id="pw-new"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        <AnimatedFieldError show={Boolean(errors.newPassword)}>
          {errors.newPassword?.message}
        </AnimatedFieldError>
      </Field>

      <Field invalid={Boolean(errors.confirmPassword)}>
        <FieldLabel htmlFor="pw-confirm">Repeat the new password</FieldLabel>
        <PasswordControl
          id="pw-confirm"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <AnimatedFieldError show={Boolean(errors.confirmPassword)}>
          {errors.confirmPassword?.message}
        </AnimatedFieldError>
      </Field>

      <Button type="submit" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}