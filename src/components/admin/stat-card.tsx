"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { cn } from "cn";
import type { KpiTrend, StatValue } from "@/lib/data/admin";
import { formatPrice } from "@/lib/utils";

/**
 * One headline number.
 *
 * The label sits above in the system's eyebrow, the value is large and
 * tabular so a column of cards reads as figures rather than prose, and the
 * trend chip is deliberately not red: forest-on-mint for a rise, quiet ink for
 * a fall, because the dashboard reports rather than scolds.
 *
 * The value counts up once on mount — the only entrance this card has — and
 * jumps straight to the answer when the visitor prefers reduced motion. The
 * animated figure is `aria-hidden` beside an sr-only final value, so screen
 * readers hear the number, not the animation.
 */
export function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: StatValue;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduceMotion || value.value === 0) {
      setShown(value.value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Ease-out cubic: quick at the start, a soft landing on the real figure.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value.value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value.value, reduceMotion]);

  const format = (amount: number) =>
    value.isMoney ? formatPrice(amount) : amount.toLocaleString("en-US");

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-ink/10 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>

          <p className="font-heading mt-2.5 text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-ink tabular-nums">
            <span className="sr-only">{format(value.value)}</span>
            <span aria-hidden="true">{format(shown)}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {value.trend ? <TrendChip trend={value.trend} /> : null}
            <span className="text-xs text-ink/45">{value.caption}</span>
          </div>
        </div>

        {value.spark && value.spark.length > 1 ? (
          <Sparkline values={value.spark} />
        ) : null}
      </div>
    </article>
  );
}

function TrendChip({ trend }: { trend: KpiTrend }) {
  if (trend.pct === null || trend.dir === "flat") {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-ink/[0.05] px-2 text-xs font-medium text-ink/55 tabular-nums">
        &mdash;
      </span>
    );
  }

  const up = trend.dir === "up";
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-xs font-medium tabular-nums",
        up ? "bg-mint text-forest" : "bg-ink/[0.06] text-ink/65",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span aria-hidden="true">
        {up ? "+" : "\u2212"}
        {Math.abs(trend.pct).toFixed(1)}%
      </span>
      <span className="sr-only">
        {up ? "up" : "down"} {Math.abs(trend.pct).toFixed(1)} percent
      </span>
    </span>
  );
}

/**
 * Thirty days of a series as one thin line. Normalised to its own min and max
 * so a quiet week still shows its shape, with a dot on the present moment.
 * Purely decorative — the value beside it already says what matters.
 */
function Sparkline({ values }: { values: number[] }) {
  const width = 80;
  const height = 28;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const points = values.map((entry, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 2 - ((entry - min) / span) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points[points.length - 1].split(",");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-7 w-20 shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-leaf)"
        strokeOpacity={0.75}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill="var(--color-forest)" />
    </svg>
  );
}
