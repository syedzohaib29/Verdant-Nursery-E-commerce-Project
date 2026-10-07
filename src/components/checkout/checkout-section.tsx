"use client";

import { CircleCheckIcon } from "lucide-react";

import { cn } from "cn";

type SectionStatus = "active" | "complete" | "idle";

/**
 * One numbered section of the checkout.
 *
 * Four states a shopper should be able to read at a glance, in order: the
 * section they are in is filled forest with the page number, a section they
 * have finished collapses into a one-line summary with an Edit affordance, and
 * a section they have not reached sits dimmed — a promise about how much is
 * left, not a wall.
 */
export function CheckoutSection({
  index,
  title,
  eyebrow,
  status,
  summary,
  onEdit,
  children,
}: {
  index: number;
  title: string;
  eyebrow: string;
  status: SectionStatus;
  /** The one-line recap shown when the section is finished and collapsed. */
  summary?: React.ReactNode;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  const complete = status === "complete";
  const active = status === "active";

  if (complete && onEdit) {
    return (
      <section
        aria-label={title}
        className="rounded-2xl border border-ink/10 bg-white transition-colors duration-300 ease-verdant"
      >
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition-colors duration-200 hover:bg-mint/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-6"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint text-forest">
            <CircleCheckIcon
              aria-hidden="true"
              strokeWidth={2.25}
              className="size-4"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-small font-medium text-ink/50">
              {eyebrow}
            </span>
            <span className="block text-body font-semibold text-ink">
              {title}
            </span>
            {summary ? (
              <span className="mt-0.5 block truncate text-small text-ink/60">
                {summary}
              </span>
            ) : null}
          </span>

          <span className="shrink-0 rounded-lg px-2.5 py-1.5 text-small font-medium text-forest transition-colors duration-200 hover:bg-mint">
            Edit
          </span>
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl border bg-white transition-colors duration-300 ease-verdant",
        active ? "border-forest/40" : "border-ink/10",
      )}
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full text-small font-semibold",
              active
                ? "bg-forest text-white"
                : "border border-ink/15 bg-white text-ink/40",
            )}
          >
            {index}
          </span>
          <div className="min-w-0">
            <p className="text-small font-medium text-ink/50">{eyebrow}</p>
            <h2
              className={cn(
                "font-heading text-lg font-bold tracking-[-0.01em] text-ink",
                !active && "text-ink/45",
              )}
            >
              {title}
            </h2>
          </div>
        </div>

        {active ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}