import type { Metadata } from "next";

import { CategoryBento } from "@/components/home/category-bento";
import { CareTips } from "@/components/home/care-tips";
import { FeaturedPlants } from "@/components/home/featured-plants";
import { Hero } from "@/components/home/hero";
import { JournalPreview } from "@/components/home/journal-preview";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { Testimonials } from "@/components/home/testimonials";
import { TrustStrip } from "@/components/home/trust-strip";
import { WhyVerdant } from "@/components/home/why-verdant";
import { getCategories } from "@/lib/data/categories";
import { getJournalPosts } from "@/lib/data/journal";
import { getFeaturedProducts, getShopStats } from "@/lib/data/products";
import { getLatestReviews } from "@/lib/data/reviews";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Verdant — Plants with good manners",
  description:
    "A small nursery in Portland. Houseplants that overwintered on our own shelf, arrive in soil that drains, and come with the light they expect named on the card.",
};

/** The care-tip posts, so the journal preview below never repeats them. */
const CARE_TIP_COUNT = 3;

export default async function HomePage() {
  const [featured, stats, categories, reviews, settings, posts] =
    await Promise.all([
      getFeaturedProducts(8),
      getShopStats(),
      getCategories(),
      getLatestReviews(6),
      getSettings(),
      getJournalPosts({ limit: CARE_TIP_COUNT * 2 }),
    ]);

  // Six posts: the newest three are the practical ones we want in front of
  // somebody about to buy a plant, and the three behind them fill the journal
  // preview. If the catalogue is smaller than that, the preview repeats rather
  // than rendering an empty section.
  const careTips = posts.slice(0, CARE_TIP_COUNT);
  const used = new Set(careTips.map((post) => post.slug));
  const remaining = posts.filter((post) => !used.has(post.slug));
  const journal = (remaining.length > 0 ? remaining : posts).slice(0, 3);

  // One image for the "why" band. A category portrait reads as a plant on a
  // bench rather than as an abstract illustration, which suits a section about
  // how the shop actually works.
  const whyImage = categories[0]?.image ?? "";

  return (
    <>
      <Hero
        hero={featured[0] ?? null}
        spotlight={featured[1] ?? null}
        petSafeCount={stats.petSafe}
      />

      <TrustStrip
        freeShippingLabel={settings.freeShippingThresholdLabel}
        petSafeCount={stats.petSafe}
      />

      <CategoryBento categories={categories} />

      <FeaturedPlants products={featured} total={stats.products} />

      {whyImage ? <WhyVerdant image={whyImage} /> : null}

      <CareTips posts={careTips} />

      <Testimonials reviews={reviews} />

      <JournalPreview posts={journal} />

      <NewsletterBand />
    </>
  );
}