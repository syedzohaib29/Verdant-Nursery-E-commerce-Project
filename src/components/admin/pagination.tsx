import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "cn";

/**
 * Page links for the admin order list.
 *
 * Links, not buttons: a page of results is a page, and pages have URLs — the
 * back button, a reload and a shared link all keep working. The window is
 * capped at five numbers for the same reason the shop's strip is: a ledger of
 * a few dozen orders does not need forty links and a decorative ellipsis.
 *
 * `hrefFor` keeps the caller's filters and sort in every page link; the
 * component never has to know what a query string means.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const window = pageWindow(page, pageCount);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <PageLink href={hrefFor(page - 1)} rel="prev" className="min-h-11 gap-1.5">
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
          Previous
        </PageLink>
      ) : (
        <span aria-hidden="true" className="min-h-11" />
      )}

      <ol className="flex items-center gap-1">
        {window.map((entry) =>
          entry === null ? (
            <li key="gap" aria-hidden="true" className="px-1 text-ink/40">
              &hellip;
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={hrefFor(entry)}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`Page ${entry}`}
                className={cn(
                  "tabular-nums flex size-11 items-center justify-center rounded-lg text-[0.9375rem] transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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
          href={hrefFor(page + 1)}
          rel="next"
          className="ml-auto min-h-11 gap-1.5"
        >
          Next
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </PageLink>
      ) : (
        <span aria-hidden="true" className="ml-auto min-h-11" />
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
        "inline-flex items-center rounded-lg px-3 text-[0.9375rem] font-medium text-forest transition-colors duration-200 outline-none hover:bg-ink/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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

  const start = Math.min(Math.max(page - 2, 1), pageCount - 4);
  const pages = Array.from({ length: 5 }, (_, index) => start + index);

  return [
    ...(start > 1 ? [1, null] : []),
    ...pages,
    ...(start + 4 < pageCount ? [null, pageCount] : []),
  ];
}
