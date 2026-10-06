"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signInWithCredentials } from "@/app/actions/auth";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordControl } from "@/components/auth/password-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

/**
 * Sign in.
 *
 * React Hook Form for the fields, Zod for the error copy, and the server action as
 * the actual control — the client schema is a convenience and the action is the
 * gate, exactly as with the newsletter form.
 *
 * `callbackUrl` decides where somebody lands afterwards and is validated as a
 * same-site path by the action itself. Validating it here too would be theatre: it
 * is read off a query string by a browser the customer controls.
 *
 * Errors are asked for on `onTouched` rather than only on submit: the first
 * blur is where somebody finds out a field was filled wrong, and waiting for a
 * button press to say so means a whole round trip to be told about one typo.
 */
export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    const result = await signInWithCredentials({ ...values, redirectTo: callbackUrl });

    if (result.success) {
      // Only reachable if the framework did not redirect, which would be a fault
      // rather than a state worth showing a form for.
      return;
    }

    const emailError = result.fieldErrors.email?.[0];
    const passwordError = result.fieldErrors.password?.[0];

    if (emailError) setError("email", { message: emailError });
    if (passwordError) setError("password", { message: passwordError });

    if (!emailError && !passwordError) setFormError(result.error);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <FormAlert message={formError} />

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

      <Field invalid={Boolean(errors.password)}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <PasswordControl
          id="password"
          autoComplete="current-password"
          {...register("password")}
        />
        <AnimatedFieldError show={Boolean(errors.password)}>
          {errors.password?.message}
        </AnimatedFieldError>
      </Field>

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Sign in
      </Button>

      <p className="text-[0.875rem] text-ink/60">
        No account yet?{" "}
        <Link
          href={registerHref(callbackUrl)}
          className="rounded-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

/** Keeps the return path when moving between the two forms. */
function registerHref(callbackUrl: string): string {
  return callbackUrl === "/" ? "/register" : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
