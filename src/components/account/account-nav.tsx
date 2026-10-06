"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  PackageIcon,
  UserIcon,
} from "lucide-react";

import { safeCallbackUrl } from "@/lib/redirects";

import { cn } from "cn";

/**
 * The account area's own navigation.
 *
 * Two versions of the same four destinations, chosen by viewport and rendered by
 * one component so the list cannot drift between them. On a desktop the pages sit
 * in a side rail with a profile chip and a sign-out on the far side; on a phone
 * they are a strip of tabs the width of a thumb, capped so a fast flick cannot
 * overshoot past the last item and maroon you at a blank edge.
 *
 * The side rail and the strip never both participate in the layout: the strip is
 * `lg:hidden` and the rail `hidden lg:block`, and a `display:none` element is not
 * a grid item, so on a large screen the rail and the page content are the only
 * two cells even though this component renders extra markup in the same grid.
 */
const ITEMS = [
  { href: "/account", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/account/orders", label: "Orders", icon: PackageIcon },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/addresses", label: "Addresses", icon: MapPinIcon },
] as const;

export function AccountNav({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const initial = userName.trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile: a snap-capped strip with a fade on the right telling the thumb
          there is more to come. */}
      <nav
        aria-label="Account"
        className="relative -mx-5 lg:hidden"
      >
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className="snap-start">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-medium transition-colors duration-200",
                    active
                      ? "border-forest bg-forest text-white"
                      : "border-ink/15 bg-transparent text-ink/70 hover:border-ink/30 hover:text-ink",
                  )}
                >
                  <item.icon aria-hidden="true" strokeWidth={1.75} className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-warm-white to-transparent"
        />
      </nav>

      {/* Desktop: the rail. */}
      <aside className="hidden lg:block">
        <div className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-4">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest text-[0.875rem] leading-none font-semibold text-white"
          >
            {initial}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[0.9375rem] font-medium text-ink">
              {userName}
            </span>
            <span className="truncate text-[0.75rem] text-ink/55">{userEmail}</span>
          </span>
        </div>

        <nav aria-label="Account" className="mt-6">
          <ul className="grid gap-1">
            {ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-4 text-[0.9375rem] font-medium transition-colors duration-200",
                      active
                        ? "bg-mint text-forest"
                        : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink",
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      strokeWidth={1.75}
                      className={cn("size-4.5", active ? "text-forest" : "text-ink/45")}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 border-t border-ink/10 pt-4">
          <button
            type="button"
            onClick={() => void signOut({ redirectTo: safeCallbackUrl("/") })}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-4 text-[0.9375rem] font-medium text-ink/70 transition-colors duration-200 outline-none hover:bg-ink/[0.04] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LogOutIcon aria-hidden="true" strokeWidth={1.75} className="size-4.5 text-ink/45" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}