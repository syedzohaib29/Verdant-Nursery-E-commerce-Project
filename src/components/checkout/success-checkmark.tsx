"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The tick that announces an order is on the books.
 *
 * Two strokes, 600ms total: the circle draws in 400ms, then the check in
 * 200ms — a signature rather than a flash, and one that the rest of the
 * confirmation waits for. Reduced-motion visitors get the finished mark with
 * no drawing.
 */
export function SuccessCheckmark() {
  const reduce = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="size-20 text-forest"
      initial={{ scale: reduce ? 1 : 0.82, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
      />
      <motion.path
        d="M15 25l6 6 12-13"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: reduce ? 0 : 0.2,
          ease: EASE,
          delay: reduce ? 0 : 0.4,
        }}
      />
    </motion.svg>
  );
}