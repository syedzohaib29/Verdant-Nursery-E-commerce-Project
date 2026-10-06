"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Everything on this page rises and fades on one curve, never on a bounce.
 */
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

/**
 * Reveal one block as it enters the viewport, once.
 *
 * `whileInView` rather than `animate` so content further down the page settles in
 * as the visitor reaches it. The `data-reveal` attribute is the hook the
 * `<noscript>` rule in the root layout uses to un-hide content if JavaScript
 * never arrives.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.42, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parent for a group of `StaggerItem`s. Children animate in order off one
 * trigger, so a list reads as a single gesture instead of several.
 *
 * `firstLoadOnly` is for the shop grid, which is re-rendered by the server on every
 * filter change. Re-running an eight-item entrance each time somebody narrows a
 * filter turns navigation into a slideshow, and it draws the eye away from the
 * results that just changed. After the first mount the group starts in its `visible`
 * state, so children mount already settled. Motion still handles the mount, so
 * there is no flash and no hydration mismatch.
 */
export function Stagger({
  children,
  className,
  delay = 0,
  interval = 0.08,
  firstLoadOnly = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  interval?: number;
  firstLoadOnly?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

  const entrance = !reduceMotion && (!firstLoadOnly || !mounted.current);

  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={entrance ? "hidden" : "visible"}
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: entrance ? interval : 0,
            delayChildren: entrance ? delay : 0,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal=""
      className={className}
      variants={
        reduceMotion
          ? {
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0 } },
            }
          : {
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.42, ease: EASE },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}
