"use client";

import { useEffect } from "react";
import Link from "next/link";

import { DroopingPlant } from "@/components/brand/drooping-plant";
import { Button } from "@/components/ui/button";

/**
 * The error boundary for the whole app.
 *
 * Rendered when a segment throws, in place of whatever was loading. The reset
 * button re-renders the failed segment rather than reloading the page, so a
 * transient failure (a dropped database connection, a slow upstream) usually
 * fixes itself in one press without the visitor losing their place.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The visitor only needs "try again". The detail goes to the console, where
    // it is actually useful.
    console.error(error);
  }, [error]);

  return (
    <main id="content" className="flex flex-1 items-center bg-warm-white">
      <div className="container-x py-20">
        <div className="mx-auto max-w-md text-center">
          <DroopingPlant className="mx-auto size-24 text-forest" />

          <p className="eyebrow mt-8">Something fell off the shelf</p>

          <h1 className="mt-3 text-h2 text-ink">
            The kettle is on. We&apos;re on it.
          </h1>

          <p className="mt-4 text-pretty text-body text-ink/70">
            A shelf gave way while this page was loading. Whatever went wrong is
            being looked at — give it one more go, and it will likely be back
            before the water boils.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>

            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back to the home page
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}