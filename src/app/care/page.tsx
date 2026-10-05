import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Keeping it alive — Verdant",
  description:
    "Light, water, and the two mistakes that kill more houseplants than anything else.",
};

const NOTES = [
  {
    eyebrow: "Light",
    heading: "Name the spot before you buy.",
    body: "A windowsill is bright indirect light. Six feet back from a window is not. If you cannot say roughly how many hours a day the spot sees sun, guess low and pick a plant that tolerates being wrong.",
  },
  {
    eyebrow: "Water",
    heading: "Test the soil, not the calendar.",
    body: "Push a finger a knuckle into the soil. If it still feels damp, leave it alone. Watering on a schedule is the single most common way people drown a plant that was doing fine.",
  },
  {
    eyebrow: "Drainage",
    heading: "A pot with a hole is not optional.",
    body: "Roots sitting in water have no air. If you are keeping a plant in a cachepot, tip the excess away after you water, or leave a gap so it can drain.",
  },
];

export default function CarePage() {
  return (
    <main className="flex-1">
      <section className="bg-mint px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest">
            Care notes
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Most houseplants die of kindness.
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Overwatering and wrong light account for most of what we see on the
            returns bench. Neither is expensive to fix, and neither needs a
            gadget.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          {NOTES.map((note, index) => (
            <article
              key={note.eyebrow}
              className="border-t border-ink/10 py-8 first:border-t-0 first:pt-0 lg:grid lg:grid-cols-[auto_1fr_1.4fr] lg:gap-12 lg:py-12"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-leaf lg:tabular-nums">
                {String(index + 1).padStart(2, "0")} — {note.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl tracking-tight text-ink lg:mt-0">
                {note.heading}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground lg:mt-1">
                {note.body}
              </p>
            </article>
          ))}

          <div className="mt-12 border-t border-ink/10 pt-8">
            <Button className="min-h-11 px-6 text-base" render={<Link href="/shop" />}>
              Browse the greenhouse
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}