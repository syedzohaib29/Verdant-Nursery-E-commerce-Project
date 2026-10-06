"use client";

import { motion, useReducedMotion } from "motion/react";

import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The hero entrance: the one bold load animation on the site.
 *
 * Each headline line sits inside a clipped box and slides up from below it, so the
 * type appears to be pulled out from behind a mask rather than simply fading in.
 * Everything else — eyebrow, paragraph, buttons — is a quiet fade underneath it.
 * One strong move and two supporting ones; a page where everything animates has
 * nothing left to emphasise.
 *
 * The mask is a fixed-height box, which means a descender on the first line ("good")
 * would be cut off for good once the animation finished. The padding/negative
 * margin pair gives the glyphs the room they need without changing the layout.
 */
export function HeroEntrance({
  eyebrow,
  lines,
  children,
}: {
  eyebrow: string;
  /** Already-broken lines. The mask can only reveal what it is given. */
  lines: string[];
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: EASE, delay },
        };

  return (
    <>
      <motion.p
        {...rise(0)}
        className="eyebrow"
        data-reveal=""
      >
        {eyebrow}
      </motion.p>

      <h1 className="mt-6 text-display text-ink">
        {lines.map((line, index) => (
          <span
            key={line}
            className="block overflow-hidden pb-[0.14em] -mb-[0.14em]"
          >
            <motion.span
              className="block"
              initial={reduceMotion ? { opacity: 0 } : { y: "112%" }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.3 }
                  : { duration: 0.72, ease: EASE, delay: 0.08 + index * 0.09 }
              }
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.div {...rise(0.34)} data-reveal="">
        {children}
      </motion.div>
    </>
  );
}