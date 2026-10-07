import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { MarkdownBody } from "@/components/journal/markdown-body";
import { PostCard } from "@/components/journal/post-card";
import { ReadingProgress } from "@/components/journal/reading-progress";
import { ShareBar } from "@/components/journal/share-bar";
import { ShopThePost } from "@/components/journal/shop-the-post";
import { getJournalPostBySlug, getRelatedPosts } from "@/lib/data/journal";
import { SITE_URL } from "@/lib/site";

type Props = PageProps<"/journal/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPostBySlug(slug);

  if (!post) return { title: "Not on the bench" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: `${post.title} — the Verdant journal`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [
        {
          url: `${SITE_URL}${post.coverImage}`,
          alt: "",
          width: 1600,
          height: 1000,
        },
      ],
    },
  };
}

export default async function JournalPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getJournalPostBySlug(slug);

  if (!post) notFound();

  const related = await getRelatedPosts(post.slug);

  return (
    <div className="bg-warm-white">
      <ReadingProgress />

      <article>
        <header className="pt-10 pb-8 lg:pt-14 lg:pb-10">
          <div className="container-x">
            <div className="mx-auto max-w-[42rem]">
              <Link
                href="/journal"
                className="inline-flex h-11 items-center gap-2 text-small font-medium text-ink/60 transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                The journal
              </Link>

              <p className="mt-6 text-small font-medium tracking-wide text-ink/55 uppercase">
                {post.publishedAtLabel} · {post.readMinutes} min read · by{" "}
                {post.author}
              </p>

              <h1 className="mt-3 font-heading text-h1 font-semibold tracking-[-0.03em] text-ink">
                {post.title}
              </h1>

              <p className="mt-5 text-pretty text-h3 font-normal leading-snug text-ink/70">
                {post.excerpt}
              </p>
            </div>
          </div>
        </header>

        <div className="container-x">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-mint">
            <Image
              src={post.coverImage}
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="(min-width: 1024px) 74vw, 92vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="py-12 lg:py-16">
          <div className="container-x">
            <div className="mx-auto max-w-[42rem]">
              <MarkdownBody content={post.content} />

              <div className="mt-10 border-t border-ink/10 pt-6">
                <ShareBar title={post.title} slug={post.slug} />
              </div>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-label="Related posts" className="border-t border-ink/10 bg-white py-14">
          <div className="container-x">
            <p className="eyebrow">Keep reading</p>
            <h2 className="mt-2 font-heading text-h3 font-semibold text-ink">
              More from the bench
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((post) => (
                <PostCard key={post.id} post={post} aspectClassName="aspect-[4/5]" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ShopThePost slug={post.slug} />
    </div>
  );
}