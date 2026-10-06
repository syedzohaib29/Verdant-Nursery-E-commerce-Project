"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { FieldControl } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { cn } from "cn";

/**
 * A password field with a way to see what you typed.
 *
 * The toggle sits inside the control rather than beside it, so the field keeps
 * its width and the label keeps its position — a reveal button on the outside
 * would push the input narrower than every other field on the form, which is the
 * kind of small inconsistency that makes a page feel assembled rather than
 * designed.
 *
 * The label on the button changes between "Show password" and "Hide password"
 * rather than a constant label with `aria-pressed`, because that is the version
 * a screen reader announces in the most useful order: what the button will do
 * next, not a state you have to hold in your head. It is a real `<button
 * type="button">`, so it is in the tab order, cannot submit the form by accident,
 * and gets a 48px target — comfortably past the 44px minimum.
 */
export function PasswordControl({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <FieldControl
        render={
          <Input
            {...props}
            type={visible ? "text" : "password"}
            className={cn("pr-12", className)}
          />
        }
      />

      <button
        type="button"
        onClick={() => setVisible((open) => !open)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-ink/45 transition-colors duration-200 ease-verdant outline-none hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
      >
        {visible ? (
          <EyeOffIcon aria-hidden="true" className="size-4" />
        ) : (
          <EyeIcon aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
