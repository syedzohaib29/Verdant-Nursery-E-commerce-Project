"use client";

import { useReducedMotion } from "motion/react";
import { motion } from "motion/react";

import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One orchestrated entrance for a view: children fade and rise together on a
 * single stagger. Collapses to a plain render when the visitor prefers reduced
 * motion.
 */
export function Entrance({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.42, ease: EASE },
        },
      }}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.42, ease: EASE },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}