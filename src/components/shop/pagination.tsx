import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "cn";
import { shopHref, type ShopQuery } from "@/lib/shop-query";

/**
 * Server-side pagination.
 *
 * Plain links, because a page of results is a page, and pages have URLs. It works
 * with the back button, survives a reload, and is operable before JavaScript loads.
 *
 * The window of page numbers is capped at five: a catalogue of twenty-eight things
 * does not need a forty-link strip, and the ellipsis is a lie anyway — it implies
 * a jump that is not there.
 */
export function Pagination({
  query,
  page,
  pageCount,
}: {
  query: ShopQuery;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const window = pageWindow(page, pageCount);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6"
    >
      {page > 1 ? (
        <PageLink
          href={shopHref({ ...query, page: page - 1 })}
          rel="prev"
          className="min-h-11 gap-1.5"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
          Previous
        </PageLink>
      ) : (
        <span className="min-h-11" />
      )}

      <ol className="flex items-center gap-1">
        {window.map((entry) =>
          entry === null ? (
            <li
              key="gap"
              aria-hidden="true"
              className="px-1 text-ink/40"
            >
              &hellip;
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={shopHref({ ...query, page: entry })}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`Page ${entry}`}
                className={cn(
                  "tabular-nums flex size-11 items-center justify-center rounded-lg text-[0.9375rem] transition-colors duration-200",
                  entry === page
                    ? "bg-forest font-semibold text-white"
                    : "text-ink hover:bg-ink/[0.05]",
                )}
              >
                {entry}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < pageCount ? (
        <PageLink
          href={shopHref({ ...query, page: page + 1 })}
          rel="next"
          className="ml-auto min-h-11 gap-1.5"
        >
          Next
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </PageLink>
      ) : (
        <span className="ml-auto min-h-11" />
      )}
    </nav>
  );
}

function PageLink({
  href,
  rel,
  className,
  children,
}: {
  href: string;
  rel: "prev" | "next";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      rel={rel}
      className={cn(
        "inline-flex items-center rounded-lg px-3 text-[0.9375rem] font-medium text-forest transition-colors duration-200 hover:bg-ink/[0.05]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Up to five page numbers, with `null` standing in for a break. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  // Always keep the current page centred, then clip to the ends.
  const start = Math.min(Math.max(page - 2, 1), pageCount - 4);
  const pages = Array.from({ length: 5 }, (_, index) => start + index);

  return [
    ...(start > 1 ? [1, null] : []),
    ...pages,
    ...(start + 4 < pageCount ? [null, pageCount] : []),
  ];
}
