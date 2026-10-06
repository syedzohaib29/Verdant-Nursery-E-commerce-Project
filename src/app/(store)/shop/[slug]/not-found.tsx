import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * A plant that is not on the bench.
 *
 * Reached by a slug that never existed, by a plant we have retired, and by a link
 * somebody typed from memory — three different mistakes, so the copy has to work
 * for all three without pretending to know which one it was.
 *
 * It offers the greenhouse and the care notes. It does not offer a search box:
 * somebody who arrived here with a plant in mind already knows the name they
 * wanted, and a box they have to type it into again is a second chance to get it
 * wrong.
 */
export default function ProductNotFound() {
  return (
    <section className="bg-warm-white py-24 lg:py-32">
      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow">Not on the bench</p>

          <h1 className="mt-6 text-pretty text-h1 text-ink">
            We have never heard of that one.
          </h1>

          <p className="mt-5 text-pretty text-body leading-relaxed text-text-muted">
            Either the link is old, or we sold the last one and did not put another
            one in its place. Both happen. The greenhouse is fully stocked, which
            is the more useful of those two facts.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" nativeButton={false} render={<Link href="/shop" />}>
              Browse the greenhouse
            </Button>

            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/care" />}
            >
              Read the care notes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}