import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * What a widget says when the database has nothing to show.
 *
 * Not a shrug: a drawn icon, a real sentence about why the area is empty, and
 * — when there is somewhere useful to go — a way out of it. Every admin widget
 * routes through here so an empty shelf looks intentional rather than broken.
 */
export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-mint text-forest"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <p className="font-heading mt-4 text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-small text-ink/55">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
