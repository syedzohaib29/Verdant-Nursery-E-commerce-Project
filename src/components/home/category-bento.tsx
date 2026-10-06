import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { CategoryCard } from "@/lib/data/categories";
import { formatPrice } from "@/lib/utils";

/*
  Category bento.

  Six categories, six different shapes: one large tile, two medium, three small.
  A uniform grid of six squares is the fastest way to make a nursery look like a
  template, and it wastes the fact that one category deserves twice the attention.

  The desktop layout is an explicit 12-column grid with three named rows, so the
  large tile really is 2x2 and the three small tiles close the bottom row exactly.
  Everything below 1024px drops to one or two columns with per-tile aspect ratios.
*/

/** How each tile is sized, in order. Kept next to the grid classes on purpose. */
const SHAPES = ["large", "medium", "medium", "small", "small", "small"] as const;

const SHAPE_CLASSES: Record<(typeof SHAPES)[number], string> = {
  large: "aspect-[4/5] sm:col-span-2 sm:aspect-[16/9] lg:col-span-6 lg:row-span-2 lg:aspect-auto",
  medium: "aspect-[16/10] lg:col-span-6 lg:aspect-auto",
  small:
    "aspect-square sm:col-span-1 lg:col-span-4 lg:aspect-auto sm:[&:nth-child(6)]:col-span-2 sm:[&:nth-child(6)]:aspect-[16/7]",
};

export function CategoryBento({ categories }: { categories: CategoryCard[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-warm-white py-16 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-ink/10 pb-6">
            <div>
              <p className="eyebrow">Where to start</p>
              <h2 className="mt-3 max-w-[16ch] text-h2 text-ink">
                Six shelves, and no overflow bin.
              </h2>
            </div>

            <p className="max-w-md text-pretty text-body text-text-muted">
              Grouped by the problem you are trying to solve rather than by plant
              family, because that is the question people actually arrive with.
            </p>
          </div>
        </Reveal>

        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[12rem_12rem_9.5rem]">
          {categories.slice(0, SHAPES.length).map((category, index) => {
            const shape = SHAPES[index];

            return (
              <li key={category.id} className={SHAPE_CLASSES[shape]}>
                <Reveal delay={0.05 * index} className="h-full">
                  <CategoryTile category={category} large={shape === "large"} />
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CategoryTile({
  category,
  large,
}: {
  category: CategoryCard;
  large: boolean;
}) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group/tile relative flex h-full flex-col justify-end overflow-hidden rounded-lg bg-mint focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <Image
        src={category.image}
        alt=""
        aria-hidden="true"
        fill
        sizes="(min-width: 1024px) 46vw, (min-width: 640px) 48vw, 92vw"
        className="object-cover transition-transform duration-600 ease-verdant group-hover/tile:scale-105"
      />

      {/* One scrim, weighted to the bottom where the words are. The top of the
          photograph stays clear, so this is a shadow under the text rather than a
          grey wash over the whole picture. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent"
      />

      <div className="relative p-4 lg:p-5">
        <h3
          className={
            large
              ? "font-heading text-h3 font-semibold tracking-[-0.02em] text-white"
              : "font-heading text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] text-white"
          }
        >
          {category.name}
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] text-white/75">
          {category.productCount} {category.productCount === 1 ? "variety" : "varieties"}
          {category.startingPriceCents !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                from {formatPrice(category.startingPriceCents)}
              </span>
            </>
          ) : null}
        </p>

        {/* The arrow arrives from the left rather than fading, so the tile reads as
            handing you the next screen. */}
        <span
          aria-hidden="true"
          className="mt-3 inline-flex size-7 -translate-x-2 items-center justify-center rounded-full border border-white/40 text-white opacity-0 transition-[opacity,transform] duration-300 ease-verdant group-hover/tile:translate-x-0 group-hover/tile:opacity-100 group-focus-visible/tile:translate-x-0 group-focus-visible/tile:opacity-100"
        >
          <ArrowRightIcon className="size-3.5" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}