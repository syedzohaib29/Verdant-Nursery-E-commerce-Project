"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The hero's picture column.
 *
 * A client wrapper that exists only to own the entrance, because `useReducedMotion`
 * is a client hook and `Hero` is a Server Component. Passing the markup in as
 * `children` keeps every `<Image>` — and the LCP one especially — rendered on the
 * server, so the figure is in the first HTML response rather than arriving with
 * hydration.
 *
 * It enters later than the headline and travels further: the type is the thing you
 * read, the photograph is the thing that has not arrived yet, and staggering them
 * in that order is what makes the page feel composed instead of loaded.
 */
export function HeroFigure({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0.3, delay: 0.1 }
          : { duration: 0.7, ease: EASE, delay: 0.24 }
      }
      className="relative lg:col-span-5 lg:col-start-8"
    >
      {children}
    </motion.div>
  );
}