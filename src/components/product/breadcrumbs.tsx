import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "cn";

export type Crumb = {
  href: string;
  label: string;
};

/**
 * Breadcrumbs.
 *
 * Real links, with the last one marked `aria-current` rather than being a span, so
 * the trail is a navigation landmark a screen reader can list. Separators are
 * `aria-hidden`, because "chevron, Shop, chevron, Fiddle Leaf Fig" read aloud is
 * noise.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-small text-text-muted">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-ink/30"
                />
              ) : null}

              {/* `py-3` on an inline element grows the hit area without growing
                  the line box, so each crumb is a 44px target and the trail keeps
                  the height it had. */}
              <Link
                href={item.href}
                aria-current={last ? "page" : undefined}
                className={cn(
                  "rounded-sm py-3 underline-offset-4",
                  last
                    ? "text-ink"
                    : "transition-colors duration-200 hover:text-forest hover:underline",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
