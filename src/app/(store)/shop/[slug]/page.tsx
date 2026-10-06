import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, PackageIcon, TruckIcon, UndoIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/product/breadcrumbs";
import { CareAtAGlance } from "@/components/product/care-at-a-glance";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductTabs } from "@/components/product/product-tabs";
import { RatingBars } from "@/components/product/rating-bars";
import { StarRow } from "@/components/product/star-row";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ReviewForm } from "@/components/product/review-form";
import { auth } from "@/auth";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getReviewFormState, getReviewsByProduct, getReviewSummary } from "@/lib/data/reviews";
import { getSettings } from "@/lib/data/settings";

type Props = PageProps<"/shop/[slug]">;

/**
 * One plant.
 *
 * `notFound()` for anything missing, inactive or malformed, which means a
 * half-typed URL is a 404 rather than a page with holes in it. The data layer
 * returns null rather than throwing for exactly this case.
 */
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  // The session is read for one thing: whether this plant is already on the
  // visitor's wishlist. A signed-out visitor gets `null` and the heart renders
  // unfilled, which is correct — their wishlist lives in the browser and the
  // `WishlistButton` picks it up from there on the client.
  const session = await auth();
  const product = await getProductBySlug(slug, {
    userId: session?.user?.id,
  });

  if (!product) notFound();

  const [reviews, summary, related, settings, reviewState] = await Promise.all([
    getReviewsByProduct(product.id, 12),
    getReviewSummary(product.id),
    getRelatedProducts(product.id, 4),
    getSettings(),
    session?.user?.id
      ? getReviewFormState(product.id, session.user.id)
      : Promise.resolve(null),
  ]);

  return (
    <>
      <section className="bg-warm-white pt-6 pb-10 lg:pt-8 lg:pb-14">
        <div className="container-x">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/shop", label: "The greenhouse" },
              { href: `/shop?category=${product.categorySlug}`, label: product.categoryName },
              { href: `/shop/${product.slug}`, label: product.name },
            ]}
          />

          <div className="mt-6 grid gap-x-10 gap-y-10 lg:grid-cols-12 lg:gap-y-0">
            <Reveal className="lg:col-span-7">
              <ProductGallery
                images={product.images}
                name={product.name}
              />
            </Reveal>

            <div className="lg:col-span-5 lg:pl-4">
              <Reveal>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow">
                      <Link
                        href={`/shop?category=${product.categorySlug}`}
                        className="rounded-sm underline-offset-4 hover:underline"
                      >
                        {product.categoryName}
                      </Link>
                    </p>

                    <h1 className="mt-3 text-pretty text-h2 text-ink">
                      {product.name}
                    </h1>
                  </div>

                  <WishlistButton
                    productId={product.id}
                    productName={product.name}
                    initialSaved={product.isWishlisted}
                    className="shrink-0"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <StarRow
                    rating={product.rating.average}
                    count={product.rating.count}
                  />

                  <span className="text-small text-text-muted">
                    {product.rating.count === 0
                      ? "No reviews yet"
                      : `${product.rating.average} from ${product.rating.count} ${product.rating.count === 1 ? "review" : "reviews"}`}
                  </span>
                </div>

                <p className="mt-5 flex flex-wrap items-baseline gap-x-3">
                  <span
                    className={
                      product.onSale
                        ? "tabular-nums text-h3 font-semibold text-forest"
                        : "tabular-nums text-h3 font-semibold text-ink"
                    }
                  >
                    {product.priceLabel}
                  </span>

                  {product.onSale && product.salePriceLabel ? (
                    <span className="tabular-nums text-body text-ink/45 line-through">
                      {product.salePriceLabel}
                    </span>
                  ) : null}
                </p>

                <p
                  className={
                    product.inStock
                      ? "mt-2 text-small font-medium text-forest"
                      : "mt-2 text-small font-medium text-ink/60"
                  }
                >
                  {product.inStock
                    ? product.lowStock
                      ? `Only ${product.stock} left on the bench`
                      : "In stock, ready to post"
                    : "Out of stock"}
                </p>

                <p className="mt-5 max-w-prose text-pretty text-body leading-relaxed text-text-muted">
                  {product.blurb}
                </p>

                <div className="mt-7">
                  <ProductPurchase
                    item={{
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      priceCents: product.effectivePriceCents,
                      image: product.image,
                      stock: product.stock,
                    }}
                  />
                </div>

                <div className="mt-7">
                  <CareAtAGlance
                    light={product.light}
                    water={product.water}
                    petSafe={product.petSafe}
                    difficulty={product.difficulty}
                    heightCm={product.heightCm}
                  />
                </div>

                <ul className="mt-6 space-y-2.5 text-small text-text-muted">
                  <li className="flex items-start gap-2.5">
                    <TruckIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-forest"
                      strokeWidth={1.75}
                    />
                    Free shipping over{" "}
                    {settings.freeShippingThresholdLabel}, otherwise{" "}
                    {settings.shippingFeeLabel}.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <PackageIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-forest"
                      strokeWidth={1.75}
                    />
                    Packed bare-root or in its own pot, never with loose soil in the
                    box.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <UndoIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-forest"
                      strokeWidth={1.75}
                    />
                    Thirty days to change your mind on a plant that is still alive.
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 lg:py-20">
        <div className="container-x">
          <Reveal>
            <ProductTabs
              panels={[
                {
                  id: "description",
                  label: "Description",
                  content: (
                    <Prose>
                      {product.description.split(/\n{2,}/).map((paragraph) => (
                        <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                      ))}
                    </Prose>
                  ),
                },
                {
                  id: "care",
                  label: "Care guide",
                  content: (
                    <div>
                      <Prose>
                        {product.careNotes
                          .split(/\n{2,}/)
                          .map((paragraph) => (
                            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                          ))}
                      </Prose>

                      <p className="mt-8 border-t border-ink/10 pt-6 text-small text-text-muted">
                        {product.categoryName} in general:{" "}
                        {product.categoryDescription}{" "}
                        <Link
                          href={`/shop?category=${product.categorySlug}`}
                          className="text-forest underline-offset-4 hover:underline"
                        >
                          Everything in {product.categoryName}
                        </Link>
                        .
                      </p>
                    </div>
                  ),
                },
                {
                  id: "shipping",
                  label: "Shipping and returns",
                  content: (
                    <Prose>
                      <p>
                        Orders placed before 2pm on a working day go out the same
                        afternoon. Everything travels in its own box with no loose
                        soil, and the plant is braced rather than wrapped, because a
                        crushed stem is not a delivery problem a refund fixes.
                      </p>
                      <p>
                        Shipping is {settings.shippingFeeLabel} on orders under{" "}
                        {settings.freeShippingThresholdLabel} and free above it. We
                        ship Monday to Thursday: a box that sits in a depot over a
                        weekend is a plant that arrives on Monday looking like
                        Monday.
                      </p>
                      <p>
                        You have thirty days to tell us a plant did not make it. Send
                        a photograph and we replace it or refund it, whichever you
                        would rather have. We do not ask you to prove the box was not
                        left in a lorry.
                      </p>
                    </Prose>
                  ),
                },
                {
                  id: "reviews",
                  label: `Reviews (${summary.total})`,
                  // The summary sits beside the reviews rather than above them.
                  // The tabs share one grid cell sized to its tallest panel, so
                  // the height of this panel is the height of every tab: stacking
                  // a 150px histogram on top of the list left 350px of blank
                  // white under a 115px description.
                  content: (
                    <>
                    <div className="grid gap-x-12 gap-y-8 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                      <div>
                        <RatingBars summary={summary} />
                      </div>

                      {reviews.length === 0 ? (
                        <p className="border-t border-ink/10 pt-6 text-pretty text-body text-text-muted md:mt-8">
                          Nobody has reviewed this one yet. If it turns up and
                          thrives, that is the moment to say so.
                        </p>
                      ) : (
                        <ul className="space-y-8 border-t border-ink/10 pt-8 md:mt-8 md:border-t-0 md:border-l md:pt-0 md:pl-12">
                          {reviews.map((review) => (
                            <li key={review.id}>
                              <article>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                  <StarRow rating={review.rating} />
                                  <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
                                    {review.title}
                                  </h3>
                                </div>

                                <p className="mt-2.5 text-pretty text-[0.9375rem] leading-relaxed text-ink/85">
                                  {review.body}
                                </p>

                                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-muted">
                                  <span className="font-medium text-ink">
                                    {review.authorName}
                                  </span>
                                  {review.verifiedPurchase ? (
                                    <span className="text-forest">
                                      Verified buyer
                                    </span>
                                  ) : null}
                                  <span aria-hidden="true">·</span>
                                  <time>{review.createdAtLabel}</time>
                                </p>
                              </article>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <ReviewForm
                      productId={product.id}
                      slug={product.slug}
                      initial={{
                        signedIn: Boolean(session?.user?.id),
                        eligible: reviewState?.eligible ?? false,
                        existing: reviewState?.existing ?? null,
                      }}
                    />
                    </>
                  ),
                },
              ]}
            />
          </Reveal>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-warm-white py-16 lg:py-24">
          <div className="container-x">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/10 pb-6">
                <div>
                  <p className="eyebrow">Same shelf</p>
                  <h2 className="mt-3 max-w-[20ch] text-h2 text-ink">
                    Also in {product.categoryName}.
                  </h2>
                </div>

                <Link
                  href={`/shop?category=${product.categorySlug}`}
                  className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium text-forest underline-offset-[6px] hover:underline"
                >
                  The whole category
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 ease-verdant group-hover/link:translate-x-1"
                  />
                </Link>
              </div>
            </Reveal>

            <Stagger
              className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8"
              delay={0.06}
            >
              {related.map((item) => (
                <StaggerItem key={item.id}>
                  <ProductCard
                    product={item}
                    sizes="(min-width: 1024px) 21vw, (min-width: 640px) 30vw, 45vw"
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * One column of readable text, with the measure capped.
 *
 * Seeded copy is stored as Markdown source and is never rendered as HTML, so
 * paragraphs arrive as plain strings and are split on blank lines here. There is no
 * sanitiser in this path because there is no markup to sanitise.
 */
function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[62ch] space-y-4 text-pretty text-body leading-relaxed text-ink/85 [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:no-underline">
      {children}
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Not on the bench" };
  }

  const image = product.image;

  return {
    title: product.name,
    description: product.blurb,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: `${product.name} — Verdant`,
      description: product.blurb,
      type: "website",
      ...(image
        ? {
            images: [
              {
                url: image,
                alt: product.imageAlt ?? product.name,
                width: 800,
                height: 1000,
              },
            ],
          }
        : {}),
    },
  };
}
