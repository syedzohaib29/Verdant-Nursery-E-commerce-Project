"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { SearchInput } from "@/components/search-input";
import {
  BellIcon,
  ClockIcon,
  LogOutIcon,
  MenuIcon,
  PackageXIcon,
} from "lucide-react";

import { NAV_GROUPS, isActiveDestination } from "@/components/admin/nav-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminAlerts } from "@/lib/data/admin";
import { safeCallbackUrl } from "@/lib/redirects";

/*
  The sticky top bar.

  Four things live here and nothing else: where you are (a breadcrumb read from
  the same NAV_GROUPS list the rail uses, so the two agree by construction), the
  search field, the bell, and whoever is signed in.

  Search is a real input — it takes focus, Escape clears it, ⌘K finds it — but
  it does not return results yet: the order and product screens that will feed
  it arrive with their own phases. The field says so in its placeholder rather
  than pretending to a cleverness it does not have.
*/
export function AdminTopbar({
  user,
  alerts,
  onOpenMenu,
}: {
  user: { name: string; email: string };
  alerts: AdminAlerts;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [shortcut, setShortcut] = useState("⌘K");

  const title =
    NAV_GROUPS.flatMap((group) => group.items).find(
      (item) => item.href && isActiveDestination(pathname, item.href),
    )?.label ?? "Back office";

  useEffect(() => {
    const apple = /Mac|iPhone|iPad/.test(
      navigator.platform || navigator.userAgent,
    );
    setShortcut(apple ? "⌘K" : "Ctrl K");
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-warm-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center gap-3 px-5 sm:px-8 lg:px-10">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          onClick={onOpenMenu}
          className="-ml-2 shrink-0 text-ink lg:hidden"
        >
          <MenuIcon aria-hidden="true" strokeWidth={1.75} />
        </Button>

        <div className="min-w-0">
          <p className="hidden text-xs text-ink/45 sm:block">
            Verdant back office
          </p>
          <p className="truncate font-heading text-base font-semibold tracking-[-0.01em] text-ink">
            {title}
          </p>
        </div>

        <form
          className="relative ml-auto hidden w-full max-w-64 md:block lg:max-w-80"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <SearchInput
            id="admin-topbar-search"
            inputRef={searchRef}
            label="Search the back office"
            placeholder="Search orders, plants…"
            kbd={shortcut}
            inputClassName="h-10 pr-14"
          />
        </form>

        <Notifications alerts={alerts} />

        <AccountMenu user={user} />
      </div>
    </header>
  );
}

function Notifications({ alerts }: { alerts: AdminAlerts }) {
  const total = alerts.lowStock + alerts.pendingOrders;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              total > 0
                ? `Notifications, ${total} need${total === 1 ? "s" : ""} attention`
                : "Notifications, nothing needs attention"
            }
            className="relative shrink-0 text-ink"
          />
        }
      >
        <BellIcon aria-hidden="true" strokeWidth={1.75} />
        {total > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-2 right-2 size-2 rounded-full bg-leaf ring-2 ring-warm-white"
          />
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-baseline justify-between gap-3 px-2.5 pt-2 pb-1.5">
          <span className="text-sm font-semibold text-ink">Needs attention</span>
          <span className="text-xs text-ink/45 tabular-nums">
            {total === 0 ? "All clear" : `${total} now`}
          </span>
        </div>
        <DropdownMenuSeparator />

        {total === 0 ? (
          <p className="px-3 py-5 text-center text-sm text-ink/55">
            Nothing needs attention. The nursery is calm.
          </p>
        ) : (
          <div className="p-1.5">
            {alerts.lowStock > 0 ? (
              <NoticeLink
                href="/admin#low-stock"
                icon={PackageXIcon}
                title={`${alerts.lowStock} low-stock ${
                  alerts.lowStock === 1 ? "plant" : "plants"
                }`}
                detail="At or below the low-stock line"
              />
            ) : null}
            {alerts.pendingOrders > 0 ? (
              <NoticeLink
                href="/admin/orders?status=PENDING"
                icon={ClockIcon}
                title={`${alerts.pendingOrders} pending ${
                  alerts.pendingOrders === 1 ? "order" : "orders"
                }`}
                detail="Waiting on payment"
              />
            ) : null}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NoticeLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: typeof PackageXIcon;
  title: string;
  detail: string;
}) {
  return (
    <DropdownMenuItem
      render={<Link href={href} />}
      className="min-h-11 items-center gap-3 rounded-md px-2.5 py-2 text-ink focus:bg-mint focus:text-forest"
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-forest"
      >
        <Icon strokeWidth={1.75} className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="truncate text-xs text-ink/50">{detail}</span>
      </span>
    </DropdownMenuItem>
  );
}

function AccountMenu({ user }: { user: { name: string; email: string } }) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "V";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className="ml-1 flex h-11 shrink-0 items-center gap-2 rounded-lg pr-1.5 pl-1 outline-none transition-colors duration-200 hover:bg-ink/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        }
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-forest text-xs leading-none font-semibold text-white"
        >
          {initial}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-ink xl:block">
          {user.name}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2.5 py-2.5">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink/55">{user.email}</p>
          <p className="mt-1.5 text-[0.6875rem] tracking-[0.1em] text-forest uppercase">
            Admin
          </p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href="/" />}
          className="min-h-11 focus:bg-mint focus:text-forest"
        >
          View store
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-11 focus:bg-mint focus:text-forest"
          onClick={() => void signOut({ redirectTo: safeCallbackUrl("/") })}
        >
          <LogOutIcon aria-hidden="true" strokeWidth={1.75} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
