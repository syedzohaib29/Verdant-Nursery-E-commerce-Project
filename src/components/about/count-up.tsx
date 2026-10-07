"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * A number that counts up from zero the first time it is seen.
 *
 * The trigger is an IntersectionObserver, so numbers low on the page start
 * counting when they are actually reached — never on load, never more than
 * once. Reduced-motion visitors get the final figure immediately rather than
 * a count they did not ask for, and the value is rendered by the same
 * component both before and after, so there is no hydration discrepancy to
 * paper over.
 */
export function CountUp({
  to,
  suffix = "",
  duration = 1400,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const holder = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  const display = (n: number) => `${n.toLocaleString("en-US")}${suffix}`;

  useEffect(() => {
    const node = holder.current;
    if (!node) return;

    if (reduceMotion) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started.current) continue;
          started.current = true;

          const from = performance.now();

          function frame(now: number) {
            const t = Math.min(1, (now - from) / duration);
            // ease-out cubic: fast start, gentle landing
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(to * eased));
            if (t < 1) requestAnimationFrame(frame);
          }

          requestAnimationFrame(frame);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [to, duration, reduceMotion]);

  return (
    <span ref={holder} aria-label={display(to)}>
      {display(value)}
    </span>
  );
}