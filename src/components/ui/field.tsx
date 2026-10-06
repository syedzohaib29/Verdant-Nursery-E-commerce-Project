"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"
import { cn } from "cn"

const EASE = [0.22, 1, 0.36, 1] as const

/*
  Form field primitives, wrapping @base-ui/react/field.

  The primitive owns the wiring that is easy to get wrong by hand: the label is
  associated with the control, the control is pointed at its description and
  error text, `aria-invalid` lands on the control when the field is invalid, and
  state attributes (`data-valid`, `data-invalid`, `data-touched`, `data-filled`)
  are exposed for styling.

  Because it wires ids and ARIA for us, `FieldControl` renders the same `Input`
  the rest of the app uses via `render` rather than a second input primitive.
*/
function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn("group/field flex w-full flex-col gap-2", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-small font-medium text-ink select-none group-data-[invalid=true]/field:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function FieldControl({
  className,
  ...props
}: FieldPrimitive.Control.Props) {
  return (
    <FieldPrimitive.Control
      data-slot="field-control"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-small text-text-muted", className)}
      {...props}
    />
  )
}

function FieldError({ className, children, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      match
      className={cn(
        "flex items-start gap-1.5 text-small font-medium text-destructive",
        className
      )}
      {...props}
    >
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </FieldPrimitive.Error>
  )
}

/** Confirmation copy, for the one case where a field is provably right. */
function FieldSuccess({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-success"
      className={cn(
        "flex items-start gap-1.5 text-small font-medium text-forest",
        className
      )}
      {...props}
    >
      <CircleCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  )
}

/**
 * A slot that opens and closes to fit its message.
 *
 * A message that appears from nowhere shoves everything below it down a line in
 * one frame, which reads as the page flinching. This grows the slot instead: the
 * height is animated from zero to its measured value and back on the way out, so
 * whatever sits underneath moves at the speed the eye can follow.
 *
 * Two details make it behave. `AnimatePresence` starts with `initial={false}`, so
 * a message already present when the form first renders — a server-side field
 * error, say — is simply there rather than performing an entrance nobody asked
 * for. And the node keeps one identity for as long as it is shown, so a message
 * that changes from one sentence to another is replaced in place instead of
 * collapsing and re-expanding the field twice.
 */
function CollapsibleMessage({
  show,
  children,
}: {
  show: boolean
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="message"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * A field's error, in the slot above.
 *
 * `show` rather than the children themselves, because `null` and a message are
 * both valid renders and the caller should not have to know which.
 */
function AnimatedFieldError({
  show,
  children,
}: {
  show: boolean
  children: React.ReactNode
}) {
  return (
    <CollapsibleMessage show={show}>
      <FieldError>{children}</FieldError>
    </CollapsibleMessage>
  )
}

/**
 * The quieter counterpart: a hint that stands in for the error rather than
 * sitting beside it. Because both use the same slot animation they trade places
 * at the same speed, so a field that goes from "At least 8 characters" to "Use at
 * least 8 characters." reads as one line changing its mind, not two blocks
 * fighting over the space.
 */
function AnimatedFieldNote({
  show,
  children,
}: {
  show: boolean
  children: React.ReactNode
}) {
  return (
    <CollapsibleMessage show={show}>
      <p className="text-small text-text-muted">{children}</p>
    </CollapsibleMessage>
  )
}

export {
  AnimatedFieldError,
  AnimatedFieldNote,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSuccess,
}
