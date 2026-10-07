import {
  LIGHT_LEVEL_LABELS,
  type LightLevel,
  type ProductSort,
} from "@/lib/constants";
import { productFilterSchema } from "@/lib/validations/product";
import { formatPrice } from "@/lib/utils";

/*
  Shop filter state, as it travels in the URL.

  Every filter on the shop page lives in the query string. That is the whole point:
  a filtered shop is a link, so it survives a refresh, works with the back button,
  and can be pasted into a message to a friend. It also means there is exactly one
  source of truth — the URL — instead of a server copy and a client copy that drift
  the first time one of them forgets to update.

  This module is deliberately free of database and server imports so the client
  components that rewrite the URL can use the same parsing as the page that reads
  it. Client and server must never disagree about what `?petSafe=false` means.
*/

/** The parsed, normalised shape the page and the controls both work with. */
export type ShopQuery = {
  category: string | null;
  light: LightLevel | null;
  petSafe: boolean | null;
  /** Dollars. The URL says dollars because that is what a person types. */
  minPrice: number | null;
  maxPrice: number | null;
  q: string | null;
  sort: ProductSort;
  page: number;
};

/** The shop with no filters on it. */
export const DEFAULT_SHOP_QUERY: ShopQuery = {
  category: null,
  light: null,
  petSafe: null,
  minPrice: null,
  maxPrice: null,
  q: null,
  sort: "featured",
  page: 1,
};

export const SHOP_PER_PAGE = 12;

/**
 * Reads a Next.js `searchParams` object into a `ShopQuery`.
 *
 * Anything the schema rejects is dropped rather than repaired, so a mangled URL
 * lands on the unfiltered shop instead of on a filter nobody asked for. A repeated
 * parameter (`?light=low&light=bright`) takes the last value, which matches how
 * browsers and servers conventionally resolve it.
 */
export function parseShopQuery(
  params: Record<string, string | string[] | undefined>,
): ShopQuery {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const single = Array.isArray(value) ? value.at(-1) : value;
    if (single !== undefined) flat[key] = single;
  }

  const parsed = productFilterSchema.safeParse(flat);

  if (!parsed.success) return { ...DEFAULT_SHOP_QUERY };

  const value = parsed.data;

  return {
    category: value.category ?? null,
    light: value.light ?? null,
    // `?petSafe=false` is a real request — "show me everything that is *not*
    // pet-safe" — so it is kept rather than treated as no filter at all.
    petSafe: value.petSafe ?? null,
    minPrice: value.minPrice ?? null,
    maxPrice: value.maxPrice ?? null,
    q: value.q ?? null,
    sort: value.sort,
    page: value.page,
  };
}

/** The inverse of `parseShopQuery`, minus defaults, so links stay short. */
export function toSearchParams(query: ShopQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.category) params.set("category", query.category);
  if (query.light) params.set("light", query.light);
  if (query.petSafe !== null) params.set("petSafe", String(query.petSafe));
  if (query.minPrice !== null) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== null) params.set("maxPrice", String(query.maxPrice));
  if (query.q) params.set("q", query.q);
  if (query.sort !== DEFAULT_SHOP_QUERY.sort) params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));

  return params;
}

/** The href for a query. Empty params produce a bare `/shop`. */
export function shopHref(query: ShopQuery): string {
  const params = toSearchParams(query);
  const search = params.toString();
  return search ? `/shop?${search}` : "/shop";
}

/**
 * Applies one change and resets the page.
 *
 * Resetting is the point: keep a filter, land on page 4, and you get an empty grid
 * with a page number you never earned. Sort is the exception — re-sorting a page
 * you are already on is a reasonable thing to want, and the result order is the
 * only thing that changed.
 */
export function withFilter(
  query: ShopQuery,
  key: keyof ShopQuery,
  value: ShopQuery[keyof ShopQuery],
): ShopQuery {
  const next: ShopQuery = { ...query, [key]: value };

  if (key !== "sort") next.page = 1;

  // A search that has been cleared should not leave `?q=` behind.
  if (key === "q" && (value === null || value === "")) next.q = null;

  return next;
}

export type FilterChip = {
  key: keyof ShopQuery;
  label: string;
};

/**
 * The active filters, as removable chips.
 *
 * `sort` is deliberately absent: it is always visible in the sort control, so a
 * chip saying "Price, low to high" would be a second, redundant control.
 */
export function activeFilterChips(
  query: ShopQuery,
  categoryName?: string,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (query.category) {
    chips.push({
      key: "category",
      label: categoryName ?? titleCase(query.category),
    });
  }

  if (query.light) {
    chips.push({ key: "light", label: LIGHT_LEVEL_LABELS[query.light] });
  }

  if (query.petSafe !== null) {
    chips.push({
      key: "petSafe",
      label: query.petSafe ? "Pet-safe only" : "Not pet-safe",
    });
  }

  if (query.minPrice !== null) {
    chips.push({ key: "minPrice", label: `Over ${formatPrice(query.minPrice * 100)}` });
  }

  if (query.maxPrice !== null) {
    chips.push({ key: "maxPrice", label: `Under ${formatPrice(query.maxPrice * 100)}` });
  }

  if (query.q) chips.push({ key: "q", label: `“${query.q}”` });

  return chips;
}

/** How many filters are on, for the badge on the mobile Filters button. */

/** True when anything at all is narrowing the list. */
export function hasActiveFilters(query: ShopQuery): boolean {
  return (
    query.category !== null ||
    query.light !== null ||
    query.petSafe !== null ||
    query.minPrice !== null ||
    query.maxPrice !== null ||
    query.q !== null
  );
}

/**
 * `indoor-plants` reads worse as a chip than `Indoor plants`, and the category
 * name is not always on hand (the filter bar has a list of slugs, not names).
 */
function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** The human name for the current sort, for the mobile control. */
