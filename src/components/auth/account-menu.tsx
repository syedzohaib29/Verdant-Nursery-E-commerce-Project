"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { safeCallbackUrl } from "@/lib/redirects";

/**
 * The account control.
 *
 * One control, two frames of reference, and no layout shift between them. On the
 * bar it is a compact 44px control; inside the mobile menu it is a full-width
 * row. Both render the same choices — a signed-out visitor is offered Log in /
 * Register, a signed-in one gets a forest avatar whose initials open their menu —
 * which is why the two versions share this file instead of drifting.
 *
 * One deliberate asymmetry: on the bar a signed-out visitor sees the two buttons
 * inline ("Log in" and "Register"), and on mobile the same two sit in the menu
 * panel. There is no icon-only third case, because a gear that turns into two
 * sentences of options after a click is a control nobody predicts.
 *
 * The sign-out lives in here rather than on its own account page, because a page
 * whose only purpose is a sign-out button is a page nobody needs.
 *
 * Every icon in the menu is drawn at the same stroke weight (1.75) so the list
 * reads as one instrument, the way a table with one unit of measure does.
 */
export function AccountMenu({ placement = "bar" }: { placement?: "bar" | "sheet" }) {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return <SignedOut inSheet={placement === "sheet"} />;
  }

  const name = session.user.name ?? "Your account";
  const initial = name.trim().charAt(0).toUpperCase();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          placement === "bar" ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Account: ${name}`}
              className="hidden lg:inline-flex"
            />
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none transition-colors duration-200 ease-verdant hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          )
        }
      >
        {/* The forest disc with the customer's initial. No image exists to put in
            it, and a broken avatar icon is worse than a monogram nobody chose. */}
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest text-[0.8125rem] leading-none font-semibold text-white"
        >
          {initial}
        </span>

        {placement === "sheet" && (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[0.9375rem] font-medium text-ink">
              {name}
            </span>
            <span className="truncate text-[0.75rem] text-ink/55">
              {session.user.email}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Base UI's group label is a `Menu.Group` child, not a bare label — it
            exists to caption a set of items, and using it outside a group throws
            and takes the whole menu down with it. So the name and address sit in
            their own group rather than floating above the menu. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="py-2.5">
            <span className="block truncate text-[0.875rem] font-medium text-ink">
              {name}
            </span>
            <span className="mt-0.5 block truncate text-[0.75rem] font-normal text-ink/55">
              {session.user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href="/account/orders" />}
          className="min-h-11"
        >
          <PackageIcon aria-hidden="true" strokeWidth={1.75} />
          My orders
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link href="/wishlist" />} className="min-h-11">
          <HeartIcon aria-hidden="true" strokeWidth={1.75} />
          Wishlist
        </DropdownMenuItem>

        {/* The dashboard is a different job, not a bigger account, so it appears
            only on the accounts that can actually reach it. */}
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />} className="min-h-11">
            <LayoutDashboardIcon aria-hidden="true" strokeWidth={1.75} />
            Admin dashboard
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* `onClick` rather than a form, so the item keeps the menu's keyboard and
            pointer behaviour instead of re-implementing it. Base UI's menu item has
            no `onSelect` prop at all: passing one is silently dropped and leaves a
            dead sign-out sitting in the menu. Enter and Space both synthesise a
            click on a menu item, so keyboard activation still works. `signOut` is
            the client-side one on purpose: the server action's soft navigation
            leaves the already-mounted SessionProvider holding the old session. */}
        <DropdownMenuItem
          className="min-h-11 text-ink/70"
          onClick={() => void signOut({ redirectTo: safeCallbackUrl("/") })}
        >
          <LogOutIcon aria-hidden="true" strokeWidth={1.75} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Signed out: the same two choices, shaped for the surface they sit on. */
function SignedOut({ inSheet }: { inSheet: boolean }) {
  if (inSheet) {
    return (
      <div className="grid gap-2">
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Log in
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          Create an account
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-1.5 lg:flex">
      <Button
        variant="ghost"
        size="default"
        nativeButton={false}
        render={<Link href="/login" />}
      >
        Log in
      </Button>
      <Button
        variant="primary"
        size="default"
        nativeButton={false}
        render={<Link href="/register" />}
      >
        Register
      </Button>
    </div>
  );
}