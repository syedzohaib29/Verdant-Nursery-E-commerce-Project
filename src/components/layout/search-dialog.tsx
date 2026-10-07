"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { SearchIcon, CornerDownLeftIcon } from "lucide-react";

import { cn } from "cn";

/**
 * Command-style search.
 *
 * Phase 1 is interface only: it filters the site's own destinations so the
 * pattern, keyboard model and empty state are settled before a catalogue index
 * exists. No results are invented and nothing here pretends to query a
 * database it cannot reach.
 */
const DESTINATIONS = [
  {
    href: "/shop",
    label: "Shop",
    hint: "Priced by hand, watered by hand",
  },
  {
    href: "/categories",
    label: "Categories",
    hint: "Grouped by light, room and temperament",
  },
  {
    href: "/journal",
    label: "Journal",
    hint: "Notes from the potting bench",
  },
  {
    href: "/about",
    label: "About",
    hint: "Who grows the plants we sell",
  },
  {
    href: "/contact",
    label: "Contact",
    hint: "Ask before you buy, we mean it",
  },
] as const;

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return DESTINATIONS;

    return DESTINATIONS.filter(
      (destination) =>
        destination.label.toLowerCase().includes(needle) ||
        destination.hint.toLowerCase().includes(needle),
    );
  }, [query]);

  // A new query means a new list, so the highlight goes back to the top.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length === 0 ? 0 : (index + 1) % results.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? 0 : (index - 1 + results.length) % results.length,
      );
      return;
    }

    if (event.key === "Enter") {
      const destination = results[activeIndex];
      if (!destination) return;

      event.preventDefault();
      onOpenChange(false);
      router.push(destination.href);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[2px] transition-opacity duration-200 ease-verdant data-starting-style:opacity-0 data-ending-style:opacity-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 top-[14vh] z-50 mx-auto w-[calc(100%-1.5rem)] max-w-xl overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lift outline-none",
            "transition-[opacity,transform] duration-200 ease-verdant data-starting-style:translate-y-2 data-starting-style:opacity-0 data-ending-style:translate-y-2 data-ending-style:opacity-0",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search Verdant
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Type to filter the shop, categories, journal, about and contact pages.
            Use the arrow keys to move and Enter to open.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b border-ink/10 px-4">
            <SearchIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-forest"
              strokeWidth={1.75}
            />
            <input
              type="text"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              aria-expanded="true"
              aria-controls="verdant-search-results"
              aria-activedescendant={
                results[activeIndex] ? `verdant-search-${activeIndex}` : undefined
              }
              placeholder="Where are you heading?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              className="h-14 w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-ink/45"
            />
            <kbd className="hidden shrink-0 rounded-md border border-ink/10 bg-warm-white px-2 py-1 font-sans text-[0.6875rem] font-medium text-ink/60 sm:block">
              Esc
            </kbd>
          </div>

          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-body text-text-muted">
              Nothing here for &ldquo;{query.trim()}&rdquo;. The{" "}
              <Link
                href="/contact"
                onClick={() => onOpenChange(false)}
                className="text-forest underline underline-offset-4"
              >
                contact page
              </Link>{" "}
              takes plain questions.
            </p>
          ) : (
            <ul
              ref={listRef}
              id="verdant-search-results"
              role="listbox"
              aria-label="Destinations"
              className="max-h-[min(24rem,50vh)] overflow-y-auto p-2"
            >
              {results.map((destination, index) => (
                <li key={destination.href}>
                  <Link
                    id={`verdant-search-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    href={destination.href}
                    onClick={() => onOpenChange(false)}
                    onPointerMove={() => setActiveIndex(index)}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-4 rounded-xl px-3 transition-colors duration-150",
                      index === activeIndex ? "bg-mint" : "bg-transparent",
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="font-heading text-[0.9375rem] font-medium tracking-[-0.01em] text-ink">
                        {destination.label}
                      </span>
                      <span className="text-small text-text-muted">
                        {destination.hint}
                      </span>
                    </span>
                    {index === activeIndex ? (
                      <CornerDownLeftIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-forest"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
