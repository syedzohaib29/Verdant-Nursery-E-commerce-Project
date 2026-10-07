"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2Icon, SendIcon } from "lucide-react";

import { submitContactAction } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTACT_TOPIC_LABELS,
  CONTACT_TOPIC_VALUES,
  contactMessageSchema,
} from "@/lib/validations/contact";
import { z } from "zod";

type FormValues = z.infer<typeof contactMessageSchema>;

/**
 * The front door.
 *
 * A normal HTML form with a server action behind it — no network calls, no
 * client fetch. The honeypot field is there for the machines: `tabIndex={-1}`
 * keeps it out of the tab order, `autoComplete="off"` keeps a password manager
 * from filling it, and the `hidden` attribute keeps it out of sight while the
 * action still reads it. On success the form steps aside for a short note, on
 * failure it stays put with the offending fields named.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: "an-order",
      message: "",
      website: "",
    },
    mode: "onTouched",
  });

  const topic = watch("topic");

  async function onSubmit(values: FormValues) {
    const result = await submitContactAction(values);

    if (!result.success) {
      toast.error(result.error || "That did not go through. Try again?");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-forest/20 bg-white px-6 py-12 text-center"
      >
        <span className="grid size-14 place-items-center rounded-full bg-mint">
          <CheckCircle2Icon aria-hidden="true" className="size-7 text-forest" />
        </span>
        <h2 className="mt-5 font-heading text-h3 font-semibold text-ink">
          Message on the bench.
        </h2>
        <p className="mt-2 max-w-sm text-pretty text-body text-ink/70">
          Thank you — it has landed in the same inbox the whole nursery reads,
          and somebody will get back to you within two working days.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            reset();
            setSent(false);
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-lift sm:p-8"
    >
      {/* Honeypot: invisible to humans, irresistible to bots. */}
      <div hidden aria-hidden="true">
        <label htmlFor="cf-website">Leave this field empty</label>
        <input
          id="cf-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="cf-name">Your name</FieldLabel>
          <FieldControl
            render={
              <Input
                id="cf-name"
                autoComplete="name"
                placeholder="Mara Quinn"
                maxLength={80}
                {...register("name")}
              />
            }
          />
          <AnimatedFieldError show={Boolean(errors.name)}>
            {errors.name?.message}
          </AnimatedFieldError>
        </Field>

        <Field invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="cf-email">Email</FieldLabel>
          <FieldControl
            render={
              <Input
                id="cf-email"
                type="email"
                autoComplete="email"
                placeholder="mara@example.com"
                maxLength={200}
                {...register("email")}
              />
            }
          />
          <AnimatedFieldError show={Boolean(errors.email)}>
            {errors.email?.message}
          </AnimatedFieldError>
        </Field>
      </div>

      <div className="mt-5">
        <Field invalid={Boolean(errors.topic)}>
          <FieldLabel htmlFor="cf-topic">What is it about?</FieldLabel>
          <FieldControl
            render={
              <Select
                value={topic}
                onValueChange={(value) => {
                  if (value == null) return;
                  setValue("topic", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger id="cf-topic" className="w-full">
                  <SelectValue placeholder="Pick a topic" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TOPIC_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {CONTACT_TOPIC_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <AnimatedFieldError show={Boolean(errors.topic)}>
            {errors.topic?.message}
          </AnimatedFieldError>
        </Field>
      </div>

      {/* This field takes the slack in the card.

          The grid row is as tall as the column beside it — an address card and a
          map — so the form card is stretched to match it, and the space has to go
          somewhere. It goes here: the box this form actually wants to be bigger is
          the one people write into.

          `flex-1` down the chain (wrapper, `Field`, `FieldControl`) is what makes it
          grow to fill rather than sit at its minimum, and `min-h-40` is the floor
          for when there is no slack to give — a narrow screen, where the card is
          only as tall as its contents and the growth has nothing to distribute.

          `rows={6}` is left in place but is not what sizes the box: the `Textarea`
          primitive sets `field-sizing: content`, which sizes to the content and
          floors at its own `min-h-16`, and the attribute is ignored while that is
          in force. It stays as the fallback for a browser without `field-sizing`. */}
      <div className="mt-5 flex flex-1 flex-col">
        <Field invalid={Boolean(errors.message)} className="flex-1">
          <FieldLabel htmlFor="cf-message">The details</FieldLabel>
          <FieldControl
            className="min-h-40 flex-1"
            render={
              <Textarea
                id="cf-message"
                rows={6}
                maxLength={2000}
                placeholder="Tell us what is going on — plant photos welcome later, words are enough to start."
                {...register("message")}
              />
            }
          />
          <AnimatedFieldError show={Boolean(errors.message)}>
            {errors.message?.message}
          </AnimatedFieldError>
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-small text-ink/55">
          We reply within two working days — usually faster.
        </p>
        <Button type="submit" size="lg" loading={isSubmitting}>
          Send message
          <SendIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </form>
  );
}