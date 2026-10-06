"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlertIcon } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The message for a problem that belongs to the form as a whole rather than to
 * one of its fields — a rejected sign-in, a duplicate email address, a throttled
 * attempt.
 *
 * Animated for the same reason the field errors are: a banner that appears from
 * nowhere in one frame reads as the page flinching, and this is the first thing
 * somebody sees after being told they were wrong. `role="alert"` is on the
 * element that carries the text rather than the wrapper, so a screen reader
 * announces the sentence and not an empty box.
 *
 * `message` is `string | null` rather than a boolean plus a child, because the
 * only two states are "here is why" and "nothing to say".
 */
export function FormAlert({ message }: { message: string | null }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="form-alert"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: EASE }}
          className="overflow-hidden"
        >
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-forest/25 bg-mint px-4 py-3.5 text-[0.875rem] leading-relaxed text-forest"
          >
            <CircleAlertIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-forest/70"
            />
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
