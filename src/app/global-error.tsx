"use client";

import { DroopingPlant } from "@/components/brand/drooping-plant";

/**
 * The last line of defence.
 *
 * `error.tsx` still renders inside the root layout — if the root layout itself
 * throws, there is no layout left to hold it, and this file takes over from
 * `<html>` down. It deliberately carries no brand fonts or icons that depend on
 * the stylesheet: when the whole app has fallen over, a plain page that works
 * beats a pretty one that does not.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#F8F8F4] px-6 py-20 antialiased">
        <ErrorCard error={error} reset={reset} />
      </body>
    </html>
  );
}

function ErrorCard({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="content" className="mx-auto max-w-md text-center">
      <DroopingPlant className="mx-auto size-24 text-[#14532D]" />

      <p className="mt-8 text-xs font-semibold tracking-[0.14em] text-[#14532D] uppercase">
        Even the root cellar has a bad day
      </p>

      <h1 className="mt-3 font-[family-name:var(--font-bricolage)] text-3xl font-semibold tracking-[-0.02em] text-[#0B0F0C]">
        The whole bench tipped over.
      </h1>

      <p className="mt-4 text-[1.0625rem] leading-relaxed text-[#0B0F0C]/70">
        Everything you were looking at is still safe — the shop, the soil and
        the watering schedule. Start again with the button below.
      </p>

      {error.digest ? (
        <p className="mt-5 text-xs tracking-[0.06em] text-[#0B0F0C]/45 uppercase">
          Reference {error.digest} — mention it if you write to us.
        </p>
      ) : null}

      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-12 min-h-11 items-center justify-center rounded-lg bg-[#14532D] px-6 text-base font-medium text-white transition-colors duration-200 hover:bg-[#14532D]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E9B4F]"
      >
        Try again
      </button>
    </main>
  );
}