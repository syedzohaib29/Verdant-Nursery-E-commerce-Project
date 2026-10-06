"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * The database was unreachable.
 *
 * The only thing worth offering here is a retry and somewhere else to go, so this
 * is deliberately short. A long apology on an error page is a way of asking the
 * visitor to feel bad about something they cannot fix.
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what correlates this with the server log; without it an error
    // report is a rumour.
    console.error(error);
  }, [error]);

  return (
    <div>
      <section className="bg-white py-24">
        <div className="container-x">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="mt-6 max-w-2xl text-h1 text-ink">
            The greenhouse did not open.
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-text-muted">
            We could not reach the plant list just now. This is usually brief. Try
            again, or read the care notes in the meantime — they are the useful
            part anyway.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={reset}>
              Try again
            </Button>

            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/care" />}
            >
              Care notes
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
