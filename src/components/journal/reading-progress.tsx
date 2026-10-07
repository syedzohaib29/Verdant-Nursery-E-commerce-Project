"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The thin forest bar that shows how far through a post you are.
 *
 * Purely presentational (`aria-hidden`): the text of the page already carries
 * the information, and a bar is decoration. Reduced-motion visitors get no bar
 * at all rather than a bar that does not move, and the scroll listener is
 * rAF-throttled so it never re-renders more than once a frame.
 */
export function ReadingProgress() {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    let frame = 0;

    function measure() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]"
    >
      <div
        className="h-full origin-left bg-forest transition-transform duration-100 ease-linear"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}