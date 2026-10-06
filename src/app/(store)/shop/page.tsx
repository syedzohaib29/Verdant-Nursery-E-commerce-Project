import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Pagination } from "@/components/shop/pagination";
import { ShopControls } from "@/components/shop/shop-controls";
import { ShopEmptyState } from "@/components/shop/empty-state";
import { ProductCard } from "@/components/product/product-card";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { getCategories } from "@/lib/data/categories";
import { getEffectivePriceBounds, getProducts } from "@/lib/data/products";
import { parseShopQuery, shopHref, SHOP_PER_PAGE } from "@/lib/shop-query";

/**
 * The greenhouse.
 *
 * Every filter on this page is a URL, and the page is rebuilt from that URL on the
 * server. So there is no client-side filter loop that can disagree with the
 * database, a refresh keeps your place, the back button undoes the last thing you
 * did, and a filtered shop is a link you can send to somebody.
 *
 * `searchParams` is awaited, which makes the route dynamic. That is the correct
 * trade here — a shop that could not be filtered without JavaScript would be a
 * worse shop, and the cost is one database query per visit rather than a build.
 */
export const metadata: Metadata = {
  title: "The greenhouse",
  description:
    "Every plant has survived a winter on our own shelf. Priced by hand, not by a pricing model.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const query = parseShopQuery(params);

  const [page, categories, bounds] = await Promise.all([
    getProducts({
      categorySlug: query.category ?? undefined,
      light: query.light ?? undefined,
      petSafe: query.petSafe ?? undefined,
      minPriceCents:
        query.minPrice === null ? undefined : Math.round(query.minPrice * 100),
      maxPriceCents:
        query.maxPrice === null ? undefined : Math.round(query.maxPrice * 100),
      search: query.q ?? undefined,
      sort: query.sort,
      page: query.page,
      perPage: SHOP_PER_PAGE,
    }),
    getCategories(),
    getEffectivePriceBounds(),
  ]);

  const { products, total, pageCount } = page;

  // A page number past the end happens for ordinary reasons: a bookmark from a
  // wider filter, a stale result count, a link shared after the catalogue changed.
  // Answering it with the empty state would be a lie — nothing about the filters
  // failed to match. So the URL is corrected to the last real page and the query
  // runs again there, which also means the chips and the count agree with what is
  // on screen.
  if (pageCount > 0 && query.page > pageCount) {
    redirect(shopHref({ ...query, page: pageCount }));
  }

  const categoryName = categories.find(
    (category) => category.slug === query.category,
  )?.name;

  return (
    <>
      <section className="bg-warm-white pt-10 pb-10 lg:pt-14 lg:pb-12">
        <div className="container-x">
          {/* One line of scale contrast, then straight into the controls. The
              variable is the number of results, which is why it lives down in the
              toolbar: a heading that changes length on every keystroke is the
              fastest way to make a page feel unstable. */}
          <h1 className="max-w-[14ch] text-h1 text-ink">The greenhouse</h1>

          <p className="mt-5 max-w-xl text-pretty text-body text-text-muted">
            Everything here has overwintered on our own shelf. If a plant cannot
            take a real winter in a real room, we do not sell it.
          </p>
        </div>
      </section>

      <section className="bg-white py-8 lg:py-12">
        <div className="container-x">
          <ShopControls
            query={query}
            categories={categories.map((category) => ({
              name: category.name,
              slug: category.slug,
              productCount: category.productCount,
            }))}
            categoryName={categoryName}
            total={total}
            minPriceCents={bounds.minCents}
            maxPriceCents={bounds.maxCents}
          >
            {products.length === 0 ? (
              <ShopEmptyState query={query} />
            ) : (
              <>
                {/* `firstLoadOnly` because this grid is re-sent by the server on
                    every filter change, and re-running an eight-item entrance each
                    time would bury the results that just changed. */}
                <Stagger
                  firstLoadOnly
                  className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-6 xl:grid-cols-4 xl:gap-x-8"
                  delay={0.04}
                >
                  {products.map((product, index) => (
                    <StaggerItem key={product.id}>
                      <ProductCard
                        product={product}
                        priority={index < 4}
                        sizes="(min-width: 1280px) 19vw, (min-width: 1024px) 20vw, (min-width: 640px) 30vw, 45vw"
                      />
                    </StaggerItem>
                  ))}
                </Stagger>

                <Pagination
                  query={query}
                  page={query.page}
                  pageCount={pageCount}
                />
              </>
            )}
          </ShopControls>
        </div>
      </section>
    </>
  );
}
