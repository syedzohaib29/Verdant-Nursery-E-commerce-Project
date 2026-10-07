"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One orchestrated entrance per admin view.
 *
 * A template rather than a layout wrapper on purpose: a template remounts on
 * every navigation, so each view arrives with the same quiet settle instead of
 * only the first one. Content fades and lifts 10px over 320ms on the project
 * easing; people who ask for reduced motion get the fade alone.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
