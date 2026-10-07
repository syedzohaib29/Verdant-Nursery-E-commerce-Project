import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "lucide-react";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { JournalCard } from "@/lib/data/journal";

/*
  Care tips.

  Three cards, and deliberately not a card row like any other: the first card is
  wider and carries the image, the next two are text-led with a small crop, so the
  section has a shape rather than a rhythm.
*/
export function CareTips({ posts }: { posts: JournalCard[] }) {
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <section className="bg-mint py-16 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="border-b border-ink/10 pb-6">
            <p className="eyebrow">Care tips</p>
            <h2 className="mt-3 max-w-[20ch] text-h2 text-ink">
              Read one of these before you buy anything.
            </h2>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-6">
            <Article href={`/journal/${lead.slug}`} className="flex h-full flex-col">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-warm-white">
                <Image
                  src={lead.coverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="object-cover transition-transform duration-500 ease-verdant group-hover/article:scale-105"
                />
              </div>

              <ArticleBody post={lead} className="mt-5" />
            </Article>
          </Reveal>

          <Stagger className="flex flex-col gap-8 lg:col-span-6 lg:gap-0 lg:divide-y lg:divide-ink/10">
            {rest.map((post) => (
              <StaggerItem key={post.id}>
                <Article
                  href={`/journal/${post.slug}`}
                  className="flex gap-4 py-6 first:pt-0 lg:first:pt-6 lg:last:pb-0"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-warm-white sm:size-24">
                    <Image
                      src={post.coverImage}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 ease-verdant group-hover/article:scale-105"
                    />
                  </div>

                  <ArticleBody post={post} className="min-w-0" compact />
                </Article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function Article({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group/article block rounded-sm ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

function ArticleBody({
  post,
  className,
  compact = false,
}: {
  post: JournalCard;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={className}>
      <p className="eyebrow flex items-center gap-1.5">
        <ClockIcon aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        {post.readMinutes} min read
      </p>

      <h3
        className={
          compact
            ? "mt-2 font-heading text-[1.0625rem] leading-snug font-semibold tracking-[-0.015em] text-ink transition-colors duration-200 group-hover/article:text-forest"
            : "mt-2 max-w-[24ch] font-heading text-h3 font-semibold tracking-[-0.02em] text-ink transition-colors duration-200 group-hover/article:text-forest"
        }
      >
        {post.title}
      </h3>

      <p className="mt-2 line-clamp-2 max-w-prose text-pretty text-small leading-relaxed text-text-muted">
        {post.excerpt}
      </p>

      <span className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-forest">
        Read it
        <ArrowRightIcon
          aria-hidden="true"
          className="size-3.5 transition-transform duration-300 ease-verdant group-hover/article:translate-x-1"
        />
      </span>
    </div>
  );
}