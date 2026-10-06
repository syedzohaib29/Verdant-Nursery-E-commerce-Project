import Image from "next/image";
import Link from "next/link";
import { SproutIcon } from "lucide-react";

import { QuickAddButton } from "@/components/product/quick-add-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

import { cn } from "cn";

/**
 * The product card, used by every listing on the site.
 *
 * One component rather than three, because a card that looks the same on the home
 * page, in the shop grid and under "you might also like" is the cheapest way to
 * make a shop feel like one shop.
 *
 * Hierarchy is deliberately quiet: image, name, category, price. No blurb, no star
 * row, no invented urgency. The blurb lives on the product page, where there is
 * room for it, and a card that shouts six things at once is a card nobody reads.
 *
 * Both the badges and the wishlist heart are absolutely positioned inside a box
 * that is already the right size, so nothing reflows when they appear.
 */
export function ProductCard({
  product,
  className,
  priority = false,
  sizes = "(min-width: 1280px) 20vw, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 45vw",
}: {
  product: ProductCardData;
  className?: string;
  /** True for the first row of the first page, where lazy loading costs LCP. */
  priority?: boolean;
  sizes?: string;
}) {
  const swappable = product.hoverImage !== null;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-mint">
        {/* The whole image is clickable, but that duplicate link is taken out of
            the tab order so a keyboard user meets one target per product rather
            than two, and out of the accessibility tree because the name link
            below already names the product. */}
        <Link
          href={`/shop/${product.slug}`}
          className="absolute inset-0 z-0"
          tabIndex={-1}
          aria-hidden="true"
        />

        {product.image ? (
          <>
            <Image
              src={product.image}
              alt=""
              aria-hidden="true"
              fill
              priority={priority}
              sizes={sizes}
              className={cn(
                "object-cover transition-opacity duration-500 ease-verdant",
                swappable && "group-hover:opacity-0",
              )}
            />

            {product.hoverImage ? (
              <Image
                src={product.hoverImage}
                alt=""
                aria-hidden="true"
                fill
                sizes={sizes}
                className="object-cover opacity-0 transition-opacity duration-500 ease-verdant group-hover:opacity-100"
              />
            ) : null}
          </>
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center text-forest/35"
          >
            <SproutIcon className="size-10" />
          </span>
        )}

        {/* Badges and the heart share the top edge, inset from it, so a longer
            badge never nudges the heart off the image. */}
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2">
          <div className="flex flex-col items-start gap-1.5">
            {product.onSale ? <Badge tone="sale">On sale</Badge> : null}
            {product.lowStock ? (
              <Badge tone="low">Only {product.stock} left</Badge>
            ) : null}
          </div>

          {/* 36px of heart with 44px of target. The card is 150px wide on a
              360px screen, so a 44px circle would be nearly a third of the
              photograph; the pseudo-element buys the touch target the rules ask
              for without the heart growing into the plant. */}
          <div className="pointer-events-auto relative shrink-0">
            <WishlistButton
              productId={product.id}
              productName={product.name}
              className="size-9 bg-white/80 after:absolute after:-inset-1 after:content-['']"
            />
          </div>
        </div>

        {product.inStock ? (
          <div className="absolute inset-x-2 bottom-2 z-10 flex justify-end">
            <QuickAddButton
              product={product}
              className="reveal-on-hover shadow-soft"
            />
          </div>
        ) : (
          <div className="absolute inset-x-2 bottom-2 z-10 flex justify-end">
            <span className="rounded-full bg-ink/75 px-3 py-1.5 text-[0.8125rem] leading-none font-medium text-white backdrop-blur-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-[0.8125rem] leading-none text-forest">
          <Link
            href={`/shop?category=${product.categorySlug}`}
            className="rounded-sm underline-offset-4 hover:underline"
          >
            {product.categoryName}
          </Link>
        </p>

        <h3 className="mt-1.5 font-heading text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em] text-ink">
          <Link
            href={`/shop/${product.slug}`}
            className="rounded-sm transition-colors duration-200 hover:text-forest"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-auto pt-2">
          <Price product={product} />
        </p>
      </div>
    </article>
  );
}

/**
 * Price, with a sale shown as two numbers.
 *
 * On a sale the live price goes forest and the original is struck through in
 * muted ink: the eye should land on what you pay, and the second number should be
 * findable but not loud. Off sale there is one number in ink, because a card whose
 * price changes colour at random stops meaning anything.
 */
function Price({ product }: { product: ProductCardData }) {
  if (!product.onSale || !product.salePriceLabel) {
    return (
      <span className="tabular-nums text-[0.9375rem] font-medium text-ink">
        {product.priceLabel}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className="tabular-nums text-[0.9375rem] font-semibold text-forest">
        {product.priceLabel}
      </span>
      <span className="tabular-nums text-[0.8125rem] text-ink/45 line-through">
        {product.salePriceLabel}
      </span>
    </span>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "sale" | "low";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[0.6875rem] leading-none font-semibold tracking-[0.01em] whitespace-nowrap",
        tone === "sale"
          ? "bg-forest text-white"
          : "bg-white/90 text-forest backdrop-blur-sm",
      )}
    >
      {children}
    </span>
  );
}