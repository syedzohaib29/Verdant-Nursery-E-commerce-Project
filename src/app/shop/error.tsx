"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1">
      <section className="bg-white px-6 py-24 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest">
            Something went wrong
          </p>
          <h1 className="mt-6 text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
            The greenhouse did not open.
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We could not reach the plant list just now. This is usually brief.
            Try again, or read the care notes in the meantime — they are the
            useful part anyway.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="min-h-11 px-6 text-base" onClick={reset}>
              Try again
            </Button>
            <Button className="min-h-11 px-6 text-base" variant="outline" render={<Link href="/care" />}>
              Read the care notes
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}