import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, SproutIcon } from "lucide-react";

import { HeroEntrance } from "@/components/home/hero-entrance";
import { HeroFigure } from "@/components/home/hero-figure";
import { Button } from "@/components/ui/button";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

/*
  Hero.

  Asymmetric on purpose. The headline runs most of the measure on the left and the
  photograph is pushed off the right edge of the text column, so the eye crosses
  the composition instead of reading a centred stack. A small product card hangs
  off the photograph's lower corner: it is the one place on the page that shows a
  price, which is what makes the rest of the page feel like a shop rather than a
  poster.

  Mobile stacks the same pieces in reading order — headline, then the plant, then
  the price — because the overlap that makes the desktop version work needs room
  the phone does not have.
*/

/** The headline, pre-broken. The mask can only reveal the lines it is given. */
const HEADLINE = ["Plants with", "good manners."];

export function Hero({
  hero,
  spotlight,
  petSafeCount,
}: {
  /** The plant that fills the tall frame. Null when the catalogue is empty. */
  hero: ProductCardData | null;
  /** The plant in the small overlapping card. */
  spotlight: ProductCardData | null;
  petSafeCount: number;
}) {
  // The second photograph reads better in a tall frame than the first one, so it
  // is preferred whenever the catalogue has it.
  const heroFrame = hero ? (hero.hoverImage ?? hero.image) : null;
  const spotlightImage = spotlight ? (spotlight.image ?? spotlight.hoverImage) : null;

  return (
    <section className="bg-warm-white pt-6 pb-16 lg:pt-10 lg:pb-24">
      <div className="container-x">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          <div className={hero ? "lg:col-span-7 lg:pb-4" : "lg:col-span-9"}>
            <HeroEntrance
              eyebrow="A small nursery on Kiln Lane, Portland"
              lines={HEADLINE}
            >
              <p className="mt-8 max-w-[34rem] text-pretty text-body text-text-muted lg:mt-10">
                Everything here has overwintered on our own shelf, arrives in soil
                that actually drains, and comes with a card naming the light it
                expects. {petSafeCount} of the varieties are non-toxic to cats and
                dogs, and we will happily talk you out of the other ones.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3">
                <Button size="lg" nativeButton={false} render={<Link href="/shop" />}>
                  Shop plants
                  <ArrowRightIcon aria-hidden="true" />
                </Button>

                <Link
                  href="/journal"
                  className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium text-forest underline-offset-[6px] hover:underline"
                >
                  Read the care journal
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 ease-verdant group-hover/link:translate-x-1"
                  />
                </Link>
              </div>
            </HeroEntrance>
          </div>

          {hero ? (
            <HeroFigure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mint lg:aspect-[3/4]">
                {heroFrame ? (
                  <Image
                    src={heroFrame}
                    alt={
                      hero.hoverImageAlt ??
                      hero.imageAlt ??
                      `${hero.name} on the nursery bench`
                    }
                    fill
                    // This is the largest paint on the page and the thing most
                    // people arrive for, so it is fetched at full priority instead
                    // of queueing behind the type.
                    priority
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 38vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center text-forest/30"
                  >
                    <SproutIcon className="size-12" />
                  </span>
                )}
              </div>

              {spotlight && spotlightImage ? (
                <Link
                  href={`/shop/${spotlight.slug}`}
                  className="group/card mt-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-2.5 shadow-soft transition-[box-shadow,transform] duration-300 ease-verdant hover:-translate-y-0.5 hover:shadow-lift lg:absolute lg:-bottom-6 lg:-left-10 lg:mt-0 lg:w-[17rem] lg:p-3"
                >
                  <span className="relative block size-14 shrink-0 overflow-hidden rounded-lg bg-mint lg:size-16">
                    <Image
                      src={spotlightImage}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>

                  <span className="flex min-w-0 flex-col">
                    <span className="text-[0.6875rem] leading-none tracking-[0.12em] text-forest uppercase">
                      On the bench now
                    </span>
                    <span className="mt-1.5 truncate font-heading text-[0.9375rem] leading-tight font-semibold tracking-[-0.01em] text-ink">
                      {spotlight.name}
                    </span>
                    <span className="tabular-nums mt-1 text-[0.8125rem] text-text-muted">
                      {spotlight.priceLabel}
                    </span>
                  </span>

                  <ArrowRightIcon
                    aria-hidden="true"
                    className="ml-auto size-4 shrink-0 text-forest transition-transform duration-300 ease-verdant group-hover/card:translate-x-1"
                  />
                </Link>
              ) : null}
            </HeroFigure>
          ) : null}
        </div>
      </div>
    </section>
  );
}