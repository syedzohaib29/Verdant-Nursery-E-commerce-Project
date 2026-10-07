import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { FeaturedCard } from "@/components/journal/featured-card";
import { PostCard } from "@/components/journal/post-card";
import { getJournalPostsPage } from "@/lib/data/journal";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes from the bench — watering, drainage, repotting and the honest mistakes that make a plant person. Written by the people who grow your plants.",
  alternates: { canonical: "/journal" },
};

const PER_PAGE = 6;

/**
 * The cover ratios the grid cycles through. Notably *not* all the same: a wall
 * of identical 4:5 tiles reads as a catalogue, and this is a magazine.
 */
const ASPECT_CYCLE = [
  "aspect-[16/10]",
  "aspect-[3/4]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[16/10]",
  "aspect-[3/4]",
] as const;

export default async function JournalPage({
  searchParams,
}: PageProps<"/journal">) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);

  const { posts, pageCount } = await getJournalPostsPage({
    page,
    perPage: PER_PAGE,
  });

  const featured = page === 1 ? posts[0] : undefined;
  const gridPosts = featured ? posts.slice(1) : posts;

  return (
    <div className="bg-warm-white">
      <section className="pt-8 pb-10 lg:pt-12 lg:pb-14">
        <div className="container-x">
          <p className="eyebrow">The journal</p>
          <h1 className="mt-3 max-w-2xl font-heading text-h1 font-semibold tracking-[-0.03em] text-ink">
            Notes from the bench.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-body leading-relaxed text-ink/70">
            Watering, drainage, repotting and the honest mistakes that make a
            plant person. Written by the people who grow your plants — six
            hundred words, the way we&apos;d explain it over the counter.
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="pb-20">
          <div className="container-x">
            <div className="rounded-xl border border-ink/10 bg-white p-10 text-center">
              <p className="text-lg font-medium text-ink">
                The bench is between editions.
              </p>
              <p className="mt-2 text-body text-ink/60">
                The journal is quiet today, but the greenhouse is open — the
                shop still has plenty worth reading.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-small font-medium text-white transition-colors duration-200 hover:bg-forest/90"
              >
                Browse the shop
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="pb-20">
          <div className="container-x space-y-14">
            {featured ? <FeaturedCard post={featured} /> : null}

            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {gridPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  aspectClassName={ASPECT_CYCLE[index % ASPECT_CYCLE.length]}
                />
              ))}
            </div>

            {pageCount > 1 ? (
              <nav
                aria-label="Journal pages"
                className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6"
              >
                <p className="text-small text-ink/55">
                  Page {page} of {pageCount}
                </p>

                <div className="flex items-center gap-3">
                  {page > 1 ? (
                    <Link
                      href={page === 2 ? "/journal" : `/journal?page=${page - 1}`}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-ink/10 px-4 text-small font-medium text-ink/80 transition-colors duration-200 hover:border-forest/30 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <ArrowLeftIcon aria-hidden="true" className="size-4" />
                      Newer posts
                    </Link>
                  ) : null}

                  {page < pageCount ? (
                    <Link
                      href={`/journal?page=${page + 1}`}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-4 text-small font-medium text-white transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      Older posts
                      <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}