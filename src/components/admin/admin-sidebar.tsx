"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LogOutIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { STORE_DESTINATION } from "@/components/admin/nav-items";
import { LeafMark } from "@/components/layout/leaf-mark";
import { ADMIN_NAV_COOKIE } from "@/lib/constants";
import { safeCallbackUrl } from "@/lib/redirects";

import { cn } from "cn";

/**
 * The ink-black rail — and, through the mobile drawer, the same rail again.
 *
 * One component renders both: the desktop version is fixed at the left edge and
 * collapses to a 72px icon rail, the drawer's version is a full-height column
 * with no collapse control (a drawer that can shrink itself to an icon strip is
 * a puzzle, not a control). The width change is the only transition in the
 * shell, and it is disabled under prefers-reduced-motion.
 *
 * The collapsed state is written to a cookie rather than to local storage
 * because the layout reads it on the server: the rail arrives at its final
 * width with the first paint instead of starting wide and snapping shut.
 */
export function AdminSidebar({
  user,
  variant = "rail",
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  user: { name: string; email: string };
  variant?: "rail" | "sheet";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Drawer only: a chosen destination closes it. */
  onNavigate?: () => void;
}) {
  const rail = variant === "rail";
  const shut = rail && collapsed;
  const initial = user.name.trim().charAt(0).toUpperCase() || "V";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-ink",
        rail &&
          "fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-white/10 transition-[width] duration-300 ease-verdant motion-reduce:transition-none lg:flex",
        rail && shut && "w-[72px]",
      )}
    >
      {/* Mark + the shutter. Side by side when open, stacked when not. */}
      <div
        className={cn(
          "flex items-center",
          shut ? "h-24 flex-col justify-center gap-3" : "h-16 gap-2 px-4",
        )}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          aria-label="Verdant back office — overview"
          className={cn(
            "flex items-center gap-2.5 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
            shut && "justify-center",
          )}
        >
          <LeafMark className="size-6 text-leaf" />
          {shut ? null : (
            <span className="font-heading text-[1.0625rem] font-semibold tracking-[-0.02em] text-white">
              Verdant
            </span>
          )}
        </Link>

        {rail && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-white/50 outline-none transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
              shut ? "mt-1" : "ml-auto",
            )}
          >
            {collapsed ? (
              <PanelLeftOpenIcon aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
            ) : (
              <PanelLeftCloseIcon aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
            )}
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <AdminNav collapsed={shut} onNavigate={onNavigate} variant={variant} />
      </div>

      {/* The way out to the shopfront, then whoever is at the desk. */}
      <div className="border-t border-white/10 p-3">
        <Link
          href={STORE_DESTINATION.href ?? "/"}
          onClick={onNavigate}
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/65 outline-none transition-colors duration-200 hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
            shut && "justify-center px-0",
          )}
        >
          <STORE_DESTINATION.icon
            aria-hidden="true"
            strokeWidth={1.75}
            className="size-4.5 shrink-0 text-white/55"
          />
          {shut ? (
            <span className="sr-only">{STORE_DESTINATION.label}</span>
          ) : (
            <span className="truncate">{STORE_DESTINATION.label}</span>
          )}
        </Link>

        <div className={cn("mt-2 flex items-center gap-2.5 rounded-lg bg-white/[0.04] p-2.5", shut && "flex-col gap-2 px-1.5 py-2.5")}>
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest text-xs leading-none font-semibold text-white"
          >
            {initial}
          </span>
          {shut ? null : (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-white">
                {user.name}
              </span>
              <span className="truncate text-xs text-white/45">{user.email}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void signOut({ redirectTo: safeCallbackUrl("/") })}
          className={cn(
            "mt-1.5 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/60 outline-none transition-colors duration-200 hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
            shut && "justify-center px-0",
          )}
        >
          <LogOutIcon aria-hidden="true" strokeWidth={1.75} className="size-4.5 shrink-0" />
          {shut ? <span className="sr-only">Sign out</span> : <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

/**
 * The shutter's memory. Called from the shell, kept here beside the control it
 * serves: one year, same site, readable by the layout on the next request so
 * the rail never flashes open before it snaps shut.
 */
export function rememberSidebarState(collapsed: boolean) {
  document.cookie = `${ADMIN_NAV_COOKIE}=${collapsed ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
}
