"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  subscribeToNewsletter,
  type NewsletterResult,
} from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { newsletterSchema, type NewsletterInput } from "@/lib/validation";

import { cn } from "cn";

/**
 * Newsletter signup.
 *
 * React Hook Form owns the client state and the Zod schema supplies the error
 * copy, but the server action validates again — the client schema is there to be
 * fast, not to be trusted. A server-side field error is fed back into the same
 * field so one mistake never produces two different messages.
 */
export function NewsletterForm({ className }: { className?: string }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: NewsletterInput) {
    const result: NewsletterResult = await subscribeToNewsletter(values.email);
    const emailError = result.fieldErrors.email;

    if (!result.success && emailError?.length) {
      setError("email", { message: emailError[0] });
      return;
    }

    if (!result.success) {
      setError("email", { message: result.error ?? "Something went wrong." });
      return;
    }

    toast.success(result.message);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className={cn("w-full", className)}
    >
      <Field invalid={Boolean(errors.email)}>
        <FieldLabel className="sr-only">Email address</FieldLabel>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
          <FieldControl
            render={
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
              />
            }
            className="sm:rounded-r-none sm:border-r-0"
          />
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="sm:rounded-l-none sm:rounded-r-lg"
          >
            Subscribe
          </Button>
        </div>

        {errors.email ? (
          <FieldError>{errors.email.message}</FieldError>
        ) : (
          <p className="text-small text-text-muted">
            One letter a month: what is on the bench, and what we got wrong.
          </p>
        )}
      </Field>
    </form>
  );
}
