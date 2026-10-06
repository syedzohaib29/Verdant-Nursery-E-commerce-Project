"use client";

import { useEffect, useId, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  LIGHT_LEVEL_LABELS,
  LIGHT_LEVELS,
} from "@/lib/constants";
import { withFilter, type ShopQuery } from "@/lib/shop-query";

import { cn } from "cn";

/**
 * The filter controls.
 *
 * Everything that can be a link is a link: category, light and pet-safety all
 * render as buttons that navigate to the URL the choice produces. That is not a
 * shortcut — it is why the back button behaves the way a visitor expects, why the
 * filters work before JavaScript arrives, and why there is one implementation of
 * "what does selecting this do" rather than one on the server and one on the
 * client.
 *
 * Only the two things that need typing — the search box and the price bounds —
 * are inputs, and both commit through the same debounced writer.
 */

/** Long enough to finish a word, short enough that it still feels like typing. */
const DEBOUNCE_MS = 350;

export type ShopCategory = {
  name: string;
  slug: string;
  productCount: number;
};

export function FilterPanel({
  query,
  goTo,
  categories,
  minPriceCents,
  maxPriceCents,
  className,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
  categories: ShopCategory[];
  /** Cheapest and dearest thing in the catalogue, for the price placeholders. */
  minPriceCents: number;
  maxPriceCents: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-7", className)}>
      <SearchField query={query} goTo={goTo} />

      <FilterGroup legend="Category">
        <ul className="flex flex-col">
          <li>
            <Choice
              goTo={goTo}
              next={withFilter(query, "category", null)}
              active={query.category === null}
            >
              Everything
            </Choice>
          </li>

          {categories.map((category) => (
            <li key={category.slug}>
              <Choice
                goTo={goTo}
                next={withFilter(query, "category", category.slug)}
                active={query.category === category.slug}
              >
                {category.name}
                <span className="tabular-nums ml-auto text-ink/45">
                  {category.productCount}
                </span>
              </Choice>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup legend="Light">
        <ul className="flex flex-wrap gap-2">
          {LIGHT_LEVELS.map((level) => (
            <li key={level}>
              <Pill
                active={query.light === level}
                onClick={() =>
                  goTo(
                    withFilter(
                      query,
                      "light",
                      query.light === level ? null : level,
                    ),
                  )
                }
              >
                {LIGHT_LEVEL_LABELS[level]}
              </Pill>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup legend="Around animals">
        <ul className="flex flex-col">
          <li>
            <Choice
              goTo={goTo}
              next={withFilter(query, "petSafe", null)}
              active={query.petSafe === null}
            >
              No preference
            </Choice>
          </li>
          <li>
            <Choice
              goTo={goTo}
              next={withFilter(query, "petSafe", true)}
              active={query.petSafe === true}
            >
              Safe for pets
            </Choice>
          </li>
          <li>
            <Choice
              goTo={goTo}
              next={withFilter(query, "petSafe", false)}
              active={query.petSafe === false}
            >
              Not safe for pets
            </Choice>
          </li>
        </ul>
      </FilterGroup>

      <PriceBounds
        query={query}
        goTo={goTo}
        minCents={minPriceCents}
        maxCents={maxPriceCents}
      />
    </div>
  );
}

function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * One row of a single-select group.
 *
 * `aria-pressed` states exactly what this control does, which a radio group would
 * only approximate once the visual language got elaborate. Keyboard, touch and
 * pointer all get the same 44px target.
 */
function Choice({
  goTo,
  next,
  active,
  children,
}: {
  goTo: (next: ShopQuery) => void;
  next: ShopQuery;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => goTo(next)}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[0.9375rem] transition-colors duration-200",
        active ? "bg-mint font-medium text-forest" : "text-ink hover:bg-ink/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-lg border px-3.5 text-[0.8125rem] transition-colors duration-200",
        active
          ? "border-forest bg-forest font-medium text-white"
          : "border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

function SearchField({
  query,
  goTo,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
}) {
  const id = useId();
  const [text, setText] = useState(query.q ?? "");

  // The URL is the source of truth, so a Back navigation has to be able to push a
  // different query back into this input.
  useEffect(() => {
    setText(query.q ?? "");
  }, [query.q]);

  useDebouncedCommit(text, query, goTo, "q");

  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-3 block">
        Search
      </label>

      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink/45"
        />

        <Input
          id={id}
          type="search"
          value={text}
          autoComplete="off"
          placeholder="Fiddle leaf, terracotta…"
          onChange={(event) => setText(event.target.value)}
          className="h-11 pr-10 pl-10 text-[0.9375rem]"
        />

        {text ? (
          <button
            type="button"
            onClick={() => {
              setText("");
              goTo(withFilter(query, "q", null));
            }}
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink/50 transition-colors duration-200 hover:bg-ink/[0.06] hover:text-ink"
          >
            <XIcon aria-hidden="true" className="size-4" />
            <span className="sr-only">Clear the search box</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Minimum and maximum price, in dollars.
 *
 * Both boxes share one timer, so editing either one produces a single navigation
 * instead of two racing each other. An empty box means "no limit" rather than
 * zero, which is why a cleared field commits `null` and not `0`.
 */
function PriceBounds({
  query,
  goTo,
  minCents,
  maxCents,
}: {
  query: ShopQuery;
  goTo: (next: ShopQuery) => void;
  minCents: number;
  maxCents: number;
}) {
  const minId = useId();
  const maxId = useId();

  const [min, setMin] = useState(query.minPrice === null ? "" : String(query.minPrice));
  const [max, setMax] = useState(query.maxPrice === null ? "" : String(query.maxPrice));

  useEffect(() => {
    setMin(query.minPrice === null ? "" : String(query.minPrice));
  }, [query.minPrice]);

  useEffect(() => {
    setMax(query.maxPrice === null ? "" : String(query.maxPrice));
  }, [query.maxPrice]);

  useDebouncedCommit(`${min}|${max}`, query, goTo, "price");

  return (
    <fieldset>
      <legend className="eyebrow mb-3">Price</legend>

      <div className="flex items-center gap-2">
        <label htmlFor={minId} className="sr-only">
          Lowest price in dollars
        </label>
        <Input
          id={minId}
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          placeholder={dollars(minCents)}
          value={min}
          onChange={(event) => setMin(event.target.value)}
          className="h-11 text-[0.9375rem]"
        />

        <span aria-hidden="true" className="text-ink/35">
          –
        </span>

        <label htmlFor={maxId} className="sr-only">
          Highest price in dollars
        </label>
        <Input
          id={maxId}
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          placeholder={dollars(maxCents)}
          value={max}
          onChange={(event) => setMax(event.target.value)}
          className="h-11 text-[0.9375rem]"
        />
      </div>

      <p className="mt-2 text-small text-text-muted">
        In dollars. The catalogue runs {dollars(minCents)} to {dollars(maxCents)}.
      </p>
    </fieldset>
  );
}

/**
 * Commits a text field to the URL once typing stops.
 *
 * `field` names the part of the query being edited so the search box and the two
 * price boxes can share one implementation. The value is read back out of the
 * draft string here rather than being passed in, because the search box wants a
 * single string and the price pair wants two numbers out of one draft.
 */
function useDebouncedCommit(
  draft: string,
  query: ShopQuery,
  goTo: (next: ShopQuery) => void,
  field: "q" | "price",
) {
  const q = field === "q" ? draft.trim() : null;
  const [min, max] = field === "price" ? splitPriceDraft(draft) : [null, null];

  useEffect(() => {
    let next = query;

    if (field === "q") {
      if (q === (query.q ?? "")) return;
      next = withFilter(next, "q", q);
    } else {
      if (min === (query.minPrice ?? null) && max === (query.maxPrice ?? null)) return;
      if (min !== (query.minPrice ?? null)) next = withFilter(next, "minPrice", min);
      if (max !== (query.maxPrice ?? null)) next = withFilter(next, "maxPrice", max);
    }

    const timer = setTimeout(() => goTo(next), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `query` is deliberately in the list: when the URL changes from somewhere
    // else the draft has to be re-evaluated against the new value.
  }, [q, min, max, field, query, goTo]);
}

/** A `"min|max"` draft, as a tuple so the two ends cannot drift out of order. */
function splitPriceDraft(draft: string): [number | null, number | null] {
  const [min, max] = draft.split("|");
  return [numberOrNull(min), numberOrNull(max)];
}

function numberOrNull(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function dollars(cents: number): string {
  return String(Math.round(cents / 100));
}