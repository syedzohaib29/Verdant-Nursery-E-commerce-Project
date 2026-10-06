"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { cn } from "cn";

/**
 * Empty the basket, behind a confirmation.
 *
 * Not a native `confirm()`. A browser dialog is unstyled, blocks the main thread,
 * and on some platforms reads as a page that has crashed — but it is also the only
 * confirmation that cannot be dismissed by a stray Enter keypress while somebody is
 * mid-way through tapping the quantity stepper. So the second click lands *in
 * place*, on the same row, as a two-button swap.
 *
 * The destructive option moves to the right-hand side of the pair, so a customer
 * reaching for "keep my basket" out of habit — which is where the cancel button
 * lives on every dialog they have ever used — is not the one that empties it.
 */
export function ClearCartButton({ onClear }: { onClear: () => void }) {
  const [asking, setAsking] = useState(false);

  if (asking) {
    return (
      <div
        role="group"
        aria-label="Empty your basket?"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-[0.8125rem] text-ink/70">Empty the basket?</span>

        <button
          type="button"
          autoFocus
          onClick={() => setAsking(false)}
          className="h-11 rounded-lg px-3 text-[0.875rem] font-medium text-ink transition-colors duration-200 hover:bg-ink/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Keep it
        </button>

        <button
          type="button"
          onClick={() => {
            setAsking(false);
            onClear();
          }}
          className="h-11 rounded-lg bg-forest px-3 text-[0.875rem] font-medium text-white transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Empty it
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAsking(true)}
      className={cn(
        "flex h-11 items-center gap-2 rounded-lg px-3 text-[0.875rem] text-ink/60 transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <Trash2Icon aria-hidden="true" className="size-4" />
      Empty basket
    </button>
  );
}
