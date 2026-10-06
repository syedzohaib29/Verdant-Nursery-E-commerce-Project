"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { HeartIcon, SearchIcon, ShoppingBagIcon } from "lucide-react";

import { AccountMenu } from "@/components/auth/account-menu";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/layout/cart-badge";
import { LeafMark } from "@/components/layout/leaf-mark";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchDialog } from "@/components/layout/search-dialog";
import { cartCount, useCartStore } from "@/store/cart";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Scroll distance before the bar gets its background and hairline. */
const REVEAL_AT = 24;
/** The bar never hides this close to the top, so it cannot be lost. */
const HIDE_AFTER = 160;
/**
 * Minimum movement between two scroll events to count as intent. Trackpads emit
 * a stream of 1-2px deltas; without this the bar flickers on every nudge.
 */
const DELTA_THRESHOLD = 6;

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * The site bar.
 *
 * Transparent while it sits over a hero, then condensed to a translucent white
 * with a hairline once the page has moved. It gets out of the way on the way
 * down and comes straight back on the way up, so following a long page never
 * costs you the navigation.
 */
export function Navbar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [condensed, setCondensed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcut, setShortcut] = useState<string | null>(null);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const cartUnits = useCartStore(cartCount);
  const cartHydrated = useCartStore((state) => state.hydrated);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - last;

        if (Math.abs(delta) < DELTA_THRESHOLD) return;

        setCondensed(y > REVEAL_AT);
        setHidden(delta > 0 && y > HIDE_AFTER);
        last = y;
      });
    }

    setCondensed(window.scrollY > REVEAL_AT);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setSearchOpen((open) => !open);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    setShortcut(isApple ? "⌘K" : "Ctrl K");
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  /**
   * The bag's accessible name carries the count.
   *
   * Only once the basket has been read from localStorage — before that the
   * honest answer is zero, and a screen reader announcing "Cart, 0 items" and then
   * "Cart, 7 items" a moment later is worse than a name that simply settles.
   */
  const cartLabel =
    cartHydrated && cartUnits > 0
      ? `Basket, ${cartUnits} ${cartUnits === 1 ? "item" : "items"}`
      : "Basket, empty";

  return (
    <>
      <motion.header
        animate={{ y: reduceMotion ? 0 : hidden ? "-100%" : 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        className={cn(
          "sticky top-0 z-40 h-20 border-b transition-[background-color,border-color] duration-300 ease-verdant",
          condensed
            ? "border-ink/10 bg-white/80 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-x flex h-full items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg font-heading text-[1.375rem] leading-none font-semibold tracking-[-0.03em] text-ink"
          >
            <LeafMark className="size-6 text-forest" />
            Verdant
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((link) => {
                const active = isActive(link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-11 items-center text-[0.9375rem] font-medium transition-colors duration-200",
                        active ? "text-forest" : "text-ink hover:text-forest",
                      )}
                    >
                      {link.label}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-0 bottom-2.5 h-px origin-left bg-current transition-transform duration-[250ms] ease-verdant",
                          active
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-0.5 lg:gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search"
              aria-haspopup="dialog"
              onClick={() => setSearchOpen(true)}
              className="lg:hidden"
            >
              <SearchIcon aria-hidden="true" />
            </Button>

            <Button
              variant="secondary"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              className="hidden lg:inline-flex"
            >
              <SearchIcon aria-hidden="true" />
              Search
              {shortcut ? (
                <kbd className="rounded-md border border-ink/15 bg-white/70 px-1.5 py-0.5 font-sans text-[0.6875rem] font-medium tracking-[0.04em] text-ink/60">
                  {shortcut}
                </kbd>
              ) : null}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Wishlist"
              nativeButton={false} render={<Link href="/wishlist" />}
              className="hidden lg:inline-flex"
            >
              <HeartIcon aria-hidden="true" />
            </Button>

            <AccountMenu />

            {/* The bag opens the drawer rather than navigating. `/cart` is still one
                tap away, from inside the drawer, which is where somebody who came
                here to check the total expects to find it. */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={cartLabel}
              nativeButton
              onClick={openDrawer}
              className="relative"
            >
              <ShoppingBagIcon aria-hidden="true" />
              <CartBadge />
            </Button>


            <MobileMenu />
          </div>
        </div>
      </motion.header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
