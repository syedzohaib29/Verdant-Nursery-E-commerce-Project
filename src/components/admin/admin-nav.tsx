"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  NAV_GROUPS,
  isActiveDestination,
  type NavDestination,
} from "@/components/admin/nav-items";

import { cn } from "cn";

/*
  The list of destinations, rendered once and used twice: as the desktop rail's
  navigation and as the mobile drawer's, so the two can never drift apart.

  A destination the shop has not built yet is not a link that goes nowhere —
  it is an inert row that says "Soon", because a href that lands back on the
  same page is a dead button with extra steps.

  In the collapsed rail the labels disappear, so each row carries a tooltip
  that follows the pointer. It is portalled to <body> as a fixed-position
  bubble: the rail scrolls, and a tooltip inside an overflow container is a
  tooltip that gets clipped halfway through the word.
*/

export function AdminNav({
  collapsed,
  onNavigate,
  variant = "rail",
}: {
  collapsed: boolean;
  /** Mobile drawer: close it when a destination is chosen. */
  onNavigate?: () => void;
  variant?: "rail" | "sheet";
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Back office" className="flex flex-col gap-1 px-3 py-1">
      {NAV_GROUPS.map((group) => (
        <div key={group.label ?? "overview"}>
          {group.label ? (
            collapsed && variant === "rail" ? (
              <>
                <div
                  aria-hidden="true"
                  className="mx-3 my-2 border-t border-white/10"
                />
                {/* The label still exists for screen readers when the rail is shut. */}
                <p className="sr-only">{group.label}</p>
              </>
            ) : (
              <p className="px-3 pt-4 pb-1.5 text-[0.6875rem] leading-none font-medium tracking-[0.14em] text-white/45 uppercase">
                {group.label}
              </p>
            )
          ) : (
            <div className="pb-1.5" aria-hidden="true" />
          )}

          <ul className="grid gap-0.5">
            {group.items.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                active={Boolean(item.href && isActiveDestination(pathname, item.href))}
                collapsed={collapsed && variant === "rail"}
                tooltip={variant === "rail"}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  tooltip,
  onNavigate,
}: {
  item: NavDestination;
  active: boolean;
  collapsed: boolean;
  tooltip: boolean;
  onNavigate?: () => void;
}) {
  const icon = (
    <item.icon
      aria-hidden="true"
      strokeWidth={1.75}
      className={cn(
        "size-4.5 shrink-0",
        active ? "text-leaf" : item.href ? "text-white/55" : "text-white/35",
      )}
    />
  );

  const body = item.href ? (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
        collapsed && "justify-center px-0",
        active
          ? "bg-white/[0.07] text-white"
          : "text-white/65 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-leaf"
        />
      ) : null}
      {icon}
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  ) : (
    /* Inert by design: no href, no cursor, no promise the shop cannot keep yet. */
    <span
      aria-disabled="true"
      title={`${item.label} — coming soon`}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/35",
        collapsed && "justify-center px-0",
      )}
    >
      {icon}
      {collapsed ? (
        <span className="sr-only">{item.label}, coming soon</span>
      ) : (
        <>
          <span className="truncate">{item.label}</span>
          <span className="ml-auto rounded-full border border-white/15 px-1.5 py-0.5 text-[0.625rem] leading-none tracking-[0.08em] text-white/40 uppercase">
            Soon
          </span>
        </>
      )}
    </span>
  );

  if (!tooltip || !collapsed) {
    return <li>{body}</li>;
  }

  return (
    <NavTooltip label={item.soon ? `${item.label} · soon` : item.label}>
      {body}
    </NavTooltip>
  );
}

/**
 * A label that appears beside a row on hover or focus.
 *
 * Rendered through a portal into <body> with a fixed position taken from the
 * row's own rect, so it survives the rail's scroll container, its width
 * transition, and the drawer it might one day be reused in.
 */
function NavTooltip({ label, children }: { label: string; children: ReactNode }) {
  const rowRef = useRef<HTMLLIElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Anything that moves the row — a resize, a scroll, the rail opening —
  // puts the bubble back in the box rather than leaving it behind.
  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [anchor]);

  function place() {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    setAnchor({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  }

  return (
    <li
      ref={rowRef}
      onMouseEnter={place}
      onMouseLeave={() => setAnchor(null)}
      onFocusCapture={place}
      onBlurCapture={() => setAnchor(null)}
      onClick={() => setAnchor(null)}
    >
      {children}
      {mounted && anchor
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-md border border-white/10 bg-white px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-ink shadow-lift"
              style={{ top: anchor.top, left: anchor.left }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </li>
  );
}
