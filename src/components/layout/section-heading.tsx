import { cn } from "cn";

import type { ReactNode } from "react";

/**
 * The section opener used across the site: a small uppercase eyebrow, a heading
 * that is the largest thing in its band, and an optional paragraph.
 *
 * Left aligned by default. Centred is available but rarely right — centred
 * headings are the fastest way to make a page feel like a template.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  as: Heading = "h2",
  tone = "light",
  align = "start",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  /** Set this and reference it from the section's `aria-labelledby`. */
  id?: string;
  as?: "h1" | "h2" | "h3";
  tone?: "light" | "inverse";
  align?: "start" | "center";
  className?: string;
}) {
  const inverse = tone === "inverse";

  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      <p className={inverse ? "eyebrow-inverse" : "eyebrow"}>{eyebrow}</p>
      <Heading
        id={id}
        className={cn(
          "mt-4 max-w-[18ch] text-balance",
          align === "center" && "mx-auto",
          inverse ? "text-white" : "text-ink",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-xl text-pretty text-body",
            align === "center" && "mx-auto",
            inverse ? "text-mint/85" : "text-text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
