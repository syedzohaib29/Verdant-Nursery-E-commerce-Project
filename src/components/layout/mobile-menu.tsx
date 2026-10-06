"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { HeartIcon, XIcon } from "lucide-react";

import { AccountMenu } from "@/components/auth/account-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LeafMark } from "@/components/layout/leaf-mark";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Mobile navigation: a full-height sheet from the right.
 *
 * Base UI's dialog gives us the parts that are easy to get wrong — body scroll
 * lock, focus trap, Escape to dismiss, and focus returned to the trigger on
 * close. On top of that this closes on navigation (so a link never leaves the
 * panel hanging over the page it just opened) and stands down if the viewport
 * grows past the desktop breakpoint while it is open.
 */
export function MobileMenu() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");

    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="lg:hidden"
      >
        <MenuGlyph />
      </Button>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[85%] max-w-sm justify-between gap-0 border-l border-ink/10 bg-warm-white p-0"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-[1.375rem] font-semibold tracking-[-0.02em]">
              <LeafMark className="size-6 text-forest" />
              Verdant
            </SheetTitle>
            <SheetClose
              render={
                <Button variant="ghost" size="icon" aria-label="Close menu" />
              }
            >
              <XIcon aria-hidden="true" />
            </SheetClose>
          </div>

          <SheetDescription className="sr-only">
            Site navigation. Shop, Categories, Journal, About and Contact.
          </SheetDescription>

          <motion.nav
            aria-label="Mobile"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: reduceMotion ? 0 : 0.04,
                  delayChildren: reduceMotion ? 0 : 0.05,
                },
              },
            }}
            className="min-h-0 flex-1 overflow-y-auto border-t border-ink/10 px-5"
          >
            <ul>
              {LINKS.map((link) => (
                <motion.li
                  key={link.href}
                  variants={
                    reduceMotion
                      ? {
                          hidden: { opacity: 0 },
                          visible: { opacity: 1, transition: { duration: 0 } },
                        }
                      : {
                          hidden: { opacity: 0, x: 18 },
                          visible: {
                            opacity: 1,
                            x: 0,
                            transition: { duration: 0.36, ease: EASE },
                          },
                        }
                  }
                  className="border-b border-ink/10 last:border-b-0"
                >
                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href={link.href}
                        className={cn(
                          "flex min-h-16 items-center justify-between font-heading text-[2rem] leading-none font-medium tracking-[-0.03em]",
                          isActive(link.href) ? "text-forest" : "text-ink",
                        )}
                      />
                    }
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 rounded-full bg-leaf transition-opacity duration-200",
                        isActive(link.href) ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </SheetClose>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        </div>

        <div className="border-t border-ink/10 px-5 py-4">
          <AccountMenu placement="sheet" />

          <ul className="mt-1 grid gap-1">
            <li>
              <SheetClose
                nativeButton={false}
                render={
                  <Link
                    href="/wishlist"
                    className="flex min-h-11 items-center gap-3 rounded-lg text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:bg-ink/[0.04]"
                  />
                }
              >
                <HeartIcon aria-hidden="true" strokeWidth={1.75} className="size-5 text-forest" />
                Wishlist
              </SheetClose>
            </li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Two rules and a gap: a burger that stays put while the sheet is open. */
function MenuGlyph() {
  return (
    <span aria-hidden="true" className="flex flex-col gap-[5px]">
      <span className="block h-[1.5px] w-5 rounded-full bg-current" />
      <span className="block h-[1.5px] w-5 rounded-full bg-current" />
      <span className="block h-[1.5px] w-5 rounded-full bg-current" />
    </span>
  );
}
