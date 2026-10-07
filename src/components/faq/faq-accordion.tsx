"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlusIcon } from "lucide-react";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * The questions visitors actually ask, as a proper disclosure group.
 *
 * Each row's trigger is a real `<button>` with `aria-expanded` and
 * `aria-controls`, and the panel is a region announced with `aria-labelledby`
 * — keyboard and screen-reader behaviour come from the markup, not a
 * polyfill. Opening one row closes the others, so the page never scares
 * anybody with five open essays, and the height animation is skipped entirely
 * under reduced motion.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const reduceMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white shadow-lift">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none transition-colors duration-200 hover:bg-warm-white/60 focus-visible:bg-warm-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
              >
                <span className="font-heading text-lg font-semibold tracking-[-0.015em] text-ink">
                  {item.question}
                </span>
                <PlusIcon
                  aria-hidden="true"
                  className={cn(
                    "size-5 shrink-0 text-forest transition-transform duration-300 ease-verdant",
                    open && "rotate-45",
                  )}
                />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={
                    reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
                  }
                  animate={
                    reduceMotion
                      ? { opacity: 1 }
                      : { height: "auto", opacity: 1 }
                  }
                  exit={
                    reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
                  }
                  transition={{ duration: 0.32, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 sm:px-6">
                    <p className="max-w-2xl text-pretty text-body leading-relaxed text-ink/70">
                      {item.answer}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}