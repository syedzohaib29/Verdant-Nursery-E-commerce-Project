"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { StarIcon } from "lucide-react";

import { submitReviewAction } from "@/app/actions/review";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { safeCallbackUrl } from "@/lib/redirects";
import { reviewSchema, type ReviewInput } from "@/lib/validations/review";

import { cn } from "cn";

export type ReviewWidgetState = {
  signedIn: boolean;
  eligible: boolean;
  existing: {
    rating: number;
    title: string;
    body: string;
    approved: boolean;
  } | null;
};

/**
 * The "write a review" widget under the reviews list.
 *
 * Four states, one slot: a signed-out visitor is pointed at sign-in, a signed-in
 * visitor who has not bought the plant is told the rule, a buyer who already
 * reviewed it sees their words, and everyone in between gets the form. The
 * eligibility and existing review are decided by the server page; this component
 * only shows what it was handed and writes what it is told to.
 *
 * The stars are five buttons rather than a fancily-clickable div: each one is a
 * 44px target, each has a spoken name ("Rate 4 of 5 stars"), and the current
 * pick is announced in plain text under the row.
 */
export function ReviewForm({
  productId,
  slug,
  initial,
}: {
  productId: string;
  slug: string;
  initial: ReviewWidgetState;
}) {
  const [submitted, setSubmitted] = useState<
    { rating: number; title: string; body: string; approved: boolean } | null
  >(initial.existing);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId, rating: 0, title: "", body: "" },
    mode: "onTouched",
  });

  const rating = watch("rating");

  async function onSubmit(values: ReviewInput) {
    setFormError(null);

    const result = await submitReviewAction(values);

    if (!result.success) {
      const ratingError = result.fieldErrors.rating?.[0];
      const titleError = result.fieldErrors.title?.[0];
      const bodyError = result.fieldErrors.body?.[0];

      if (ratingError) setError("rating", { message: ratingError });
      if (titleError) setError("title", { message: titleError });
      if (bodyError) setError("body", { message: bodyError });

      if (!ratingError && !titleError && !bodyError) {
        setFormError(result.error);
      }
      return;
    }

    if (result.review) {
      setSubmitted(result.review);
      setFormError(null);
      toast.success(result.review.approved ? "Thanks — your review is live." : "Thanks — your review is with a human now.");
    }
  }

  // Signed out: the shortest honest message, with the way back in.
  if (!initial.signedIn) {
    return (
      <p className="border-t border-ink/10 pt-6 text-[0.9375rem] leading-relaxed text-ink/70">
        Bought it and have opinions?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl(`/shop/${slug}`))}`}
          className="rounded-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          Sign in to review
        </Link>{" "}
        — reviews come from people who actually grew the plant.
      </p>
    );
  }

  // Not a verified buyer: the rule, named plainly.
  if (!initial.eligible && !submitted) {
    return (
      <p className="border-t border-ink/10 pt-6 text-[0.9375rem] leading-relaxed text-ink/70">
        We only take reviews from verified buyers — order this one and the form
        unlocks once it is paid for.
      </p>
    );
  }

  // Already wrote one: show their words, with the honest moderation note.
  if (submitted) {
    return (
      <div className="rounded-xl border border-forest/25 bg-mint p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StarDisplay rating={submitted.rating} />
          <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
            {submitted.title}
          </h3>
        </div>
        <p className="mt-2.5 text-pretty text-[0.9375rem] leading-relaxed text-ink/80">
          {submitted.body}
        </p>
        <p className="mt-4 text-small text-forest">
          {submitted.approved
            ? "Thanks — this is live on the page."
            : "Thanks. This is with a human now and will appear once approved — usually within a day."}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-ink/10 pt-6">
      <h3 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
        Leave a review
      </h3>
      <p className="mt-1 text-small text-text-muted">
        A few honest words about how this one does in a room.
      </p>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <FormAlert message={formError} />

        <Field invalid={Boolean(errors.rating)}>
          <FieldLabel>Your rating</FieldLabel>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setValue("rating", star, { shouldValidate: true })
                }
                aria-label={`Rate ${star} of 5 stars`}
                className="flex size-11 items-center justify-center rounded-lg outline-none transition-colors duration-200 ease-verdant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <StarIcon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className={cn(
                    "size-6",
                    star <= rating
                      ? "fill-forest text-forest"
                      : "text-ink/20 hover:text-ink/35",
                  )}
                />
              </button>
            ))}
            <p className="ml-2 text-small text-text-muted" aria-live="polite">
              {rating ? `${rating} of 5 ${rating === 1 ? "star" : "stars"}` : "Pick a rating"}
            </p>
          </div>
          <AnimatedFieldError show={Boolean(errors.rating)}>
            {errors.rating?.message}
          </AnimatedFieldError>
        </Field>

        <Field invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="review-title">Title</FieldLabel>
          <FieldControl
            render={<Input id="review-title" placeholder="Thriving on the windowsill" {...register("title")} />}
          />
          <AnimatedFieldError show={Boolean(errors.title)}>
            {errors.title?.message}
          </AnimatedFieldError>
        </Field>

        <Field invalid={Boolean(errors.body)}>
          <FieldLabel htmlFor="review-body">Your review</FieldLabel>
          <FieldControl
            render={
              <Textarea
                id="review-body"
                rows={5}
                placeholder="How has it grown? Watering, light, the moment it forgave you…"
                {...register("body")}
              />
            }
          />
          <AnimatedFieldError show={Boolean(errors.body)}>
            {errors.body?.message}
          </AnimatedFieldError>
        </Field>

        <Button type="submit" loading={isSubmitting}>
          Publish review
        </Button>
      </form>
    </div>
  );
}

/** A small five-star readout for the widget's own submitted state. */
function StarDisplay({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          aria-hidden="true"
          strokeWidth={1.5}
          className={cn(
            "size-4",
            star <= rating ? "fill-forest text-forest" : "text-ink/20",
          )}
        />
      ))}
    </span>
  );
}