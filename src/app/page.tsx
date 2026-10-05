import { Sprout } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Entrance } from "@/components/entrance";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero: warm-white, left-aligned, one oversized element. */}
      <section className="bg-warm-white px-6 py-24 sm:px-8 lg:px-16 lg:py-32">
        <Entrance>
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest">
              Verdant — a small nursery
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Plants for people who forget to water.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              We grow what actually survives a busy household. Every plant
              leaves the bench with soil that drains properly and a note naming
              the light it expects — no optimism required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="min-h-11 px-6 text-base"
                render={<Link href="/shop" />}
              >
                <Sprout aria-hidden="true" />
                Browse the greenhouse
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 px-6 text-base"
                render={<Link href="/care" />}
              >
                How to keep it alive
              </Button>
            </div>
          </div>
        </Entrance>
      </section>

      {/* Mint band: denser, right-aligned, no identical card grid. */}
      <section className="bg-mint px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-3xl tracking-tight text-ink sm:text-4xl">
              We stock fewer things, on purpose.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
              Sixty varieties, not six hundred. Each one has been through a
              winter on our own shelf, so the price covers a plant we have
              actually kept alive rather than one we merely shipped.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-8 self-end border-t border-ink/10 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-forest">
                Varieties
              </dt>
              <dd className="tabular-nums mt-2 text-4xl text-ink">60</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-forest">
                Repotted weekly
              </dt>
              <dd className="tabular-nums mt-2 text-4xl text-ink">200+</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Forest band: reversed contrast, quiet close. */}
      <section className="bg-forest px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl tracking-tight text-white sm:text-4xl">
            Two questions before you buy.
          </h2>
          <p className="mt-4 leading-relaxed text-mint/90">
            How much light does the spot actually get, and how often do you
            notice a wilting plant? Answer honestly and we will tell you what to
            skip. That advice costs us sales and earns them back twice over.
          </p>
          <p className="mt-8 text-sm text-mint/70">
            Ask us anything before ordering. A real person replies.
          </p>
        </div>
      </section>
    </main>
  );
}
