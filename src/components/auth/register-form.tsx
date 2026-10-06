"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerAccount } from "@/app/actions/auth";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordControl } from "@/components/auth/password-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AnimatedFieldError,
  AnimatedFieldNote,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import {
  MIN_PASSWORD_LENGTH,
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";

/**
 * Create an account.
 *
 * Same shape as the sign-in form and for the same reason: the client schema gives
 * instant feedback, the server action is the control, and a server-side field error
 * lands in the same field a client error would so one mistake never produces two
 * different messages.
 *
 * Signing in happens inside the register action, so finishing this form lands
 * somebody on the page they were trying to reach rather than back here.
 *
 * The password hint and the password error share one slot and swap through it,
 * which is why they never both appear: telling somebody "a whole sentence works
 * well" in the same breath as "that is too short" is two opinions about the same
 * field.
 */
export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
    mode: "onTouched",
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);

    const result = await registerAccount({ ...values, redirectTo: callbackUrl });

    if (result.success) return;

    const known = ["name", "email", "password", "confirmPassword", "phone"] as const;
    let matched = false;

    for (const key of known) {
      const message = result.fieldErrors[key]?.[0];
      if (message) {
        setError(key, { message });
        matched = true;
      }
    }

    if (!matched) setFormError(result.error);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <FormAlert message={formError} />

      <Field invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <FieldControl
          render={
            <Input
              id="name"
              autoComplete="name"
              placeholder="Robin Hale"
              {...register("name")}
            />
          }
        />
        <AnimatedFieldError show={Boolean(errors.name)}>
          {errors.name?.message}
        </AnimatedFieldError>
      </Field>

      <Field invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldControl
          render={
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
          }
        />
        <AnimatedFieldError show={Boolean(errors.email)}>
          {errors.email?.message}
        </AnimatedFieldError>
      </Field>

      <Field invalid={Boolean(errors.phone)}>
        <FieldLabel htmlFor="phone">
          Phone{" "}
          <span className="font-normal text-ink/45">(optional)</span>
        </FieldLabel>
        <FieldControl
          render={
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 503 555 0148"
              {...register("phone")}
            />
          }
        />
        <AnimatedFieldError show={Boolean(errors.phone)}>
          {errors.phone?.message}
        </AnimatedFieldError>
      </Field>

      <Field invalid={Boolean(errors.password)}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <PasswordControl
          id="password"
          autoComplete="new-password"
          {...register("password")}
        />
        <AnimatedFieldError show={Boolean(errors.password)}>
          {errors.password?.message}
        </AnimatedFieldError>
        <AnimatedFieldNote show={!errors.password}>
          At least {MIN_PASSWORD_LENGTH} characters. A whole sentence works well.
        </AnimatedFieldNote>
      </Field>

      <Field invalid={Boolean(errors.confirmPassword)}>
        <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
        <PasswordControl
          id="confirmPassword"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <AnimatedFieldError show={Boolean(errors.confirmPassword)}>
          {errors.confirmPassword?.message}
        </AnimatedFieldError>
      </Field>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Create account
      </Button>

      <p className="text-[0.875rem] text-ink/60">
        Already have one?{" "}
        <Link
          href={loginHref(callbackUrl)}
          className="rounded-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

/** Keeps the return path when moving between the two forms. */
function loginHref(callbackUrl: string): string {
  return callbackUrl === "/"
    ? "/login"
    : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
