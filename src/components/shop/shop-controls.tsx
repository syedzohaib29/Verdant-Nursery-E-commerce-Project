"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";

import { FilterPanel, type ShopCategory } from "@/components/shop/filter-panel";
import { useShopQuery } from "@/components/shop/use-shop-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PRODUCT_SORT_LABELS,
  PRODUCT_SORTS,
  type ProductSort,
} from "@/lib/constants";
import {
  activeFilterChips,
  hasActiveFilters,
  withFilter,
  type ShopQuery,
} from "@/lib/shop-query";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Every interactive piece of shop chrome, in one client island.
 *
 * The product grid stays a Server Component and arrives as `children`, so filtering
 * a 12-item page never ships the other 16 products to the browser. What lives here
 * is only what has to know about the URL: the sidebar, the mobile sheet, the chips
 * and the sort control — all of which need the same "go to this query" function, and
 * a single owner of it means a single pending state to dim the grid with.
 */
export function ShopControls({
  query,
  categories,
  total,
  minPriceCents,
  maxPriceCents,
  categoryName,
  children,
}: {
  query: ShopQuery;
  categories: ShopCategory[];
  /** Total matching products across every page, before pagination. */
  total: number;
  minPriceCents: number;
  maxPriceCents: number;
  /** The selected category's display name, so the chip is not a slug. */
  categoryName?: string;
  children: React.ReactNode;
}) {
  const { goTo, isPending } = useShopQuery(query);

  const panel = (
    <FilterPanel
      query={query}
      goTo={goTo}
      categories={categories}
      minPriceCents={minPriceCents}
      maxPriceCents={maxPriceCents}
    />
  );

  return (
    <div className="grid gap-x-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        {/* Sticky, but capped to the viewport minus the navbar so a long filter
            list scrolls internally rather than being cut off by the screen edge. */}
        <div className="sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto pb-6 [scrollbar-width:thin]">
          <h2 className="eyebrow">Filter</h2>
          <div className="mt-4">{panel}</div>

          {hasActiveFilters(query) ? <ClearAll query={query} goTo={goTo} /> : null}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-ink/10 pb-4">
          <p
            aria-live="polite"
            className="tabular-nums text-[0.9375rem] text-text-muted"
          >
            <span className="font-medium text-ink">{total}</span>{" "}
            {total === 1 ? "plant" : "plants"}
            {query.page > 1 ? " on this page" : ""}
          </p>

          {/* Full width below `sm`, auto above it. The two controls together have a
              335px minimum, which is more than a 360px screen has once the
              container padding is taken off, so on a phone they get a row of
              their own and the space between them absorbs the slack. */}
          <div className="ms-auto flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <FilterSheet query={query} goTo={goTo} resultCount={total}>
              {panel}
            </FilterSheet>

            <SortSelect query={query} goTo={goTo} />
          </div>
        </div>

        <ActiveChips query={query} goTo={goTo} categoryName={categoryName} />

        {/* The dim is the loading state. Replacing the grid with skeletons on every
            filter change would mean the page jumps twice — once to the skeleton and
            once back to the same height it already was. */}
        <div
          className={cn(
            "transition-opacity duration-200 ease-verdant",
            isPending && "opacity-50",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ClearAll({
  query,
  goTo,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mt-6 -ml-3 w-full justify-start"
      onClick={() => goTo(withFilter({ ...query, ...DEFAULTS }, "page", 1))}
    >
      <XIcon aria-hidden="true" className="size-4" />
      Clear all filters
    </Button>
  );
}

/** Every filter off, sort untouched, page 1. */
const DEFAULTS = {
  category: null,
  light: null,
  petSafe: null,
  minPrice: null,
  maxPrice: null,
  q: null,
} as const;

/**
 * Removable chips for the active filters.
 *
 * Animated in and out with `AnimatePresence` rather than faded, because a chip that
 * vanishes instantly leaves a hole in the row and the eye reads that as a bug. Each
 * chip is a real link to the URL that removes it, so it works with the keyboard
 * before hydration and still reads as a link after it.
 */
function ActiveChips({
  query,
  goTo,
  categoryName,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
  categoryName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const chips = activeFilterChips(query, categoryName);

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2 pt-4">
      <AnimatePresence initial={false} mode="popLayout">
        {chips.map((chip) => (
          <motion.li
            key={chip.key}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            <button
              type="button"
              onClick={() => goTo(withFilter(query, chip.key, null))}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/15 bg-white pr-2 pl-3 text-[0.8125rem] text-ink transition-colors duration-200 hover:border-ink/40 hover:bg-ink/[0.04]"
            >
              <span className="sr-only">Remove filter</span>
              <span aria-hidden="true">{chip.label}</span>
              <XIcon aria-hidden="true" className="size-3.5 text-ink/50" />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>

      <motion.li layout={!reduceMotion}>
        <button
          type="button"
          onClick={() => goTo({ ...query, ...DEFAULTS, page: 1 })}
          className="min-h-11 rounded-full px-3 text-[0.8125rem] text-forest underline-offset-4 hover:underline"
        >
          Clear all
        </button>
      </motion.li>
    </ul>
  );
}

/**
 * Sort.
 *
 * A native `<select>` behind a styled trigger rather than a listbox: it is one
 * control instead of five, it gets the platform picker on a phone, and it is
 * operable from the keyboard without a roving tabindex to get wrong.
 */
function SortSelect({
  query,
  goTo,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
}) {
  const id = "shop-sort";

  return (
    <div className="flex items-center gap-2">
      {/* Hidden from sight below `sm`, where the row has no room for a word and a
          control. The select still shows its current value and the label is still
          announced, so nothing is lost but the redundancy. */}
      <label htmlFor={id} className="sr-only text-small text-text-muted sm:not-sr-only">
        Sort
      </label>

      <div className="relative min-w-0">
        <select
          id={id}
          value={query.sort}
          onChange={(event) =>
            goTo(withFilter(query, "sort", event.target.value as ProductSort))
          }
          className="h-11 appearance-none rounded-lg border border-ink/15 bg-white py-0 pr-9 pl-3 text-[0.875rem] text-ink transition-colors duration-200 outline-none hover:border-ink/40 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {PRODUCT_SORT_LABELS[sort]}
            </option>
          ))}
        </select>

        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 fill-none stroke-ink/55 stroke-[1.5]"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Filters, on a phone.
 *
 * A bottom sheet rather than a full-screen page because the point of the control is
 * to change one thing and get back to the plants. The sheet's own filter panel
 * navigates as you go, so the count in the footer is live and the Apply button is
 * honestly just "done" — labelled with the number it will show rather than a verb
 * that promises a commit which is not happening.
 */
function FilterSheet({
  query,
  goTo,
  resultCount,
  children,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
  resultCount: number;
  children: React.ReactNode;
}) {
  const activeCount = activeFilterChips(query).length;

  return (
    <Sheet>
      {/* The trigger is below `lg` only. Above that the sidebar is already on
          screen, and two doors to one list of filters is one door too many. */}
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-11 gap-2 lg:hidden"
          >
            <SlidersHorizontalIcon aria-hidden="true" className="size-4" />
            Filters
            {activeCount > 0 ? (
              <span className="tabular-nums rounded-full bg-forest px-1.5 text-[0.6875rem] leading-[1.375rem] text-white">
                {activeCount}
              </span>
            ) : null}
          </Button>
        }
      />

      <SheetContent
        side="bottom"
        className="max-h-[85svh] gap-0 rounded-t-2xl pb-0"
      >
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <SheetTitle className="text-h3 font-heading font-semibold tracking-[-0.02em] text-ink">
            Filter the greenhouse
          </SheetTitle>
          <SheetDescription className="mt-1.5 text-small text-text-muted">
            Changes apply as you go, and the count below follows along.
          </SheetDescription>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6">
          {children}
        </div>

        {/* Pinned to the bottom of the sheet, so "start over" and "stop fiddling"
            are both reachable without scrolling the list back up. */}
        <div className="flex items-center gap-3 border-t border-ink/10 bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <Button
            variant="outline"
            className="h-11 flex-1"
            disabled={activeCount === 0}
            onClick={() => goTo({ ...query, ...DEFAULTS, page: 1 })}
          >
            Clear
          </Button>

          <SheetClose render={<Button className="h-11 flex-[1.4]" />}>
            Show {resultCount} {resultCount === 1 ? "plant" : "plants"}
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
