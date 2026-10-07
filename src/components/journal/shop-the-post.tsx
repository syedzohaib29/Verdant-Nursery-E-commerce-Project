import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ShoppingBagIcon } from "lucide-react";

import { getProductsBySlugs } from "@/lib/data/products";
import { POST_PRODUCT_SLUGS } from "@/lib/data/journal-plants";

/**
 * The "shop the plants in this post" strip.
 *
 * The slugs come from an editorial map rather than the prose, so a post can
 * point at products without the copy becoming a storefront. When a post names
 * no plants — a potting-mix recipe has nothing to sell — the strip simply does
 * not render, instead of floating an empty shelf.
 */
export async function ShopThePost({ slug }: { slug: string }) {
  const productSlugs = POST_PRODUCT_SLUGS[slug] ?? [];
  if (productSlugs.length === 0) return null;

  const products = await getProductsBySlugs(productSlugs);
  if (products.length === 0) return null;

  return (
    <section
      aria-label="Shop the plants in this post"
      className="bg-forest text-mint"
    >
      <div className="container-x py-14 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-inverse">Straight from the post</p>
            <h2 className="mt-2 text-h3 font-heading font-semibold text-white">
              Shop the plants in this post
            </h2>
          </div>

          <Link
            href="/shop"
            className="group inline-flex h-11 items-center gap-2 text-small font-medium text-mint transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
          >
            All plants
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-ink/20">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.imageAlt ?? product.name}
                    fill
                    sizes="(min-width: 1024px) 21vw, (min-width: 640px) 30vw, 45vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBagIcon
                      aria-hidden="true"
                      className="size-8 text-ink/30"
                    />
                  </div>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-body font-medium text-white">
                  {product.name}
                </h3>
                <p className="mt-0.5 text-small text-mint/75">
                  {product.priceLabel}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}