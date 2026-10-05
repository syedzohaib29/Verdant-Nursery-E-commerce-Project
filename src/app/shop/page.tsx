import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "The greenhouse — Verdant",
  description:
    "Sixty varieties that have survived a winter on our own shelf. Priced by hand.",
};

export default async function ShopPage() {
  const plants = await getCatalog();

  return (
    <main className="flex-1">
      <section className="bg-warm-white px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest">
            The greenhouse
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Sixty varieties, and we can justify every one.
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Everything here has overwintered on our own shelf. If a plant cannot
            take a real winter in a real room, we do not sell it.
          </p>
        </div>
      </section>

      {plants.length === 0 ? (
        <section className="bg-white px-6 py-24 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl tracking-tight text-ink">
              The benches are bare this morning.
            </h2>
            <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
              Nothing is listed yet. Repotting day is Thursday, so check back then
              — or ask us what is coming out of the propagation bench.
            </p>
            <Button
              className="mt-8 min-h-11 px-6 text-base"
              variant="outline"
              render={<Link href="/care" />}
            >
              Read the care notes
            </Button>
          </div>
        </section>
      ) : (
        <section className="bg-white px-6 py-16 sm:px-8 lg:px-16">
          <ul className="mx-auto grid max-w-5xl gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {plants.map((plant) => (
              <li key={plant.id} className="border-t border-ink/10 pt-4">
                <h2 className="font-heading text-lg tracking-tight text-ink">
                  {plant.name}
                </h2>
                <p className="mt-1 text-sm text-forest">{plant.latinName}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {plant.note}
                </p>
                <p className="tabular-nums mt-4 text-base text-ink">
                  {plant.priceLabel}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}