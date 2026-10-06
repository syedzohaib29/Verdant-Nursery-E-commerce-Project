"use client";

import { motion, useReducedMotion } from "motion/react";

import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Page transition.
 *
 * A template rather than an `AnimatePresence` around the layout: the navbar and
 * footer live in `layout.tsx`, so they stay put while only the page content
 * fades and rises. Next gives each template a fresh key per navigation, which is
 * what replays this without any exit animation or layout shift — and without the
 * doubled-in-flight problem a keyed exit would cause on a sticky header.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
