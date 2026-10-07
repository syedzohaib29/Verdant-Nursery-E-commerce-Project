"use client";

import { useState } from "react";

import { cn } from "cn";

/**
 * A money field that takes dollars and reports cents.
 *
 * The person typing thinks in dollars and cents — "7.95" — and the database
 * stores integer cents. This input is the boundary: it holds a dollar string,
 * shows a currency prefix so the unit is never a guess, and calls back with
 * whole cents (or null when the field is empty, which is how "no sale price"
 * is spelled).
 *
 * Validation is deliberately loose while typing — "12." is a thing people type
 * on the way to "12.50" — and strict on blur, where a half-finished number is
 * either a real value or an empty field.
 */
export function MoneyInput({
  id,
  label,
  value,
  onChange,
  placeholder = "0.00",
  hint,
  invalid,
  className,
}: {
  id: string;
  label: string;
  /** Cents, or null for "not set". */
  value: number | null;
  onChange: (cents: number | null) => void;
  placeholder?: string;
  hint?: string;
  invalid?: boolean;
  className?: string;
}) {
  // The field holds a dollar string. Cents are converted on the way in and out
  // so the parent never has to think about the representation.
  const [text, setText] = useState(value == null ? "" : (value / 100).toFixed(2));
  const [focused, setFocused] = useState(false);

  function handleChange(next: string) {
    // Digits, one decimal point, two decimal places — the shape of a price.
    const cleaned = next.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const whole = parts[0] ?? "";
    const fraction = parts.length > 1 ? parts[1].slice(0, 2) : "";

    const nextText = parts.length > 1 ? `${whole}.${fraction}` : whole;
    setText(nextText);

    if (nextText === "" || nextText === ".") {
      onChange(null);
      return;
    }

    const dollars = Number(nextText);
    if (Number.isFinite(dollars)) {
      onChange(Math.round(dollars * 100));
    }
  }

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-small font-medium text-ink"
      >
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-small text-ink/45"
        >
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={focused ? text : value == null ? "" : (value / 100).toFixed(2)}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={invalid}
          className={cn(
            "h-12 w-full min-w-0 rounded-lg border bg-white pr-4 pl-8 text-body text-ink tabular-nums transition-[color,border-color,background-color] duration-200 ease-verdant outline-none placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-ink/[0.03] disabled:text-ink/45",
            invalid
              ? "border-destructive aria-invalid:border-destructive"
              : "border-ink/15",
          )}
        />
      </div>
      {hint ? <p className="mt-1.5 text-small text-ink/50">{hint}</p> : null}
    </div>
  );
}
