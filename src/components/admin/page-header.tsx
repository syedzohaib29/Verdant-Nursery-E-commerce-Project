import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * The heading block every admin screen opens with: eyebrow, one h1, a line of
 * context, and a place for controls that belong at the top right.
 *
 * Server-safe on purpose — pages render it directly, and only the widgets that
 * actually need interactivity become client components.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1
          className={cn(
            "font-heading text-h3 font-semibold tracking-[-0.02em] text-ink",
            eyebrow ? "mt-2" : undefined,
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-small text-ink/60">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
