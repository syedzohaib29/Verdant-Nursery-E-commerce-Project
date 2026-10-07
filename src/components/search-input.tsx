"use client";

import { useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "cn";

/**
 * The one search box, used everywhere.
 *
 * A search field needs three adornments and no more: the magnifier that names
 * it, a clear button that appears only when there is something to clear, and —
 * in toolbars that advertise a shortcut — the ⌘K badge, which steps aside while
 * typing so the two can never sit on top of each other. The browser's own ✕ is
 * hidden globally (see globals.css); this button is the only one a search box
 * shows.
 *
 * Clearing does the honest thing the field implies: it empties the box, keeps
 * your focus in it, and — when the field lives in a GET form, the way every
 * server-filtered list here does — submits that form, because a cleared search
 * is a query for *everything*, not silence. Forms that swallow submits (the
 * back-office toolbar) simply clear.
 */
export function SearchInput({
  id,
  name = "q",
  defaultValue = "",
  placeholder,
  label,
  kbd,
  wrapperClassName,
  inputClassName,
  inputRef,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  placeholder: string;
  /** Announced to assistive tech as the field's name. */
  label: string;
  /** The keyboard shortcut badge, shown only while the box is empty. */
  kbd?: string;
  wrapperClassName?: string;
  inputClassName?: string;
  /** For parents that need to reach the field — a ⌘K handler focusing it. */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const internalRef = useRef<HTMLInputElement>(null);
  const [hasText, setHasText] = useState(defaultValue.trim().length > 0);

  function clear() {
    const input = inputRef?.current ?? internalRef.current;

    if (!input) return;

    input.value = "";
    setHasText(false);
    input.focus();
    input.form?.requestSubmit();
  }

  return (
    <div className={cn("relative", wrapperClassName)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/40"
      />
      <input
        ref={inputRef ?? internalRef}
        id={id}
        type="search"
        name={name}
        defaultValue={defaultValue}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => setHasText(event.target.value.trim().length > 0)}
        className={cn(
          "h-11 w-full rounded-lg border border-ink/15 bg-white pr-11 pl-9 text-sm text-ink outline-none transition-colors duration-200 placeholder:text-ink/45 hover:border-ink/30 focus-visible:border-forest",
          inputClassName,
        )}
      />

      {kbd && !hasText ? (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-ink/15 bg-white px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink/45"
        >
          {kbd}
        </kbd>
      ) : null}

      {hasText ? (
        <button
          type="button"
          onClick={clear}
          aria-label={`Clear ${label}`}
          className="absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink/50 outline-none transition-colors duration-200 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest"
        >
          <XIcon aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
