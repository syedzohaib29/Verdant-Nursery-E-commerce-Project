import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { JournalCard } from "@/lib/data/journal";

/*
  Journal preview.

  Three posts, but weighted the other way round from the care tips above: the
  newest one gets the big landscape crop, the two behind it are listed with their
  dates. Two sections about the same subject should not share a layout, and the
  oldest post in a list is usually the one people come back for.
*/

export function JournalPreview({ posts }: { posts: JournalCard[] }) {
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <section className="bg-warm-white py-16 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="border-b border-ink/10 pb-6">
            <p className="eyebrow">From the potting bench</p>
            <h2 className="mt-3 max-w-[22ch] text-h2 text-ink">
              Notes from whoever was holding the trowel.
            </h2>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-7">
            <Link
              href={`/journal/${lead.slug}`}
              className="group/post block rounded-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-mint">
                <Image
                  src={lead.coverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 1024px) 54vw, 92vw"
                  className="object-cover transition-transform duration-500 ease-verdant group-hover/post:scale-105"
                />
              </div>

              <p className="eyebrow mt-5">
                {lead.publishedAtLabel} · {lead.readMinutes} min
              </p>

              <h3 className="mt-2 max-w-[22ch] font-heading text-h3 font-semibold tracking-[-0.02em] text-ink transition-colors duration-200 group-hover/post:text-forest">
                {lead.title}
              </h3>

              <p className="mt-2 max-w-prose text-pretty text-small leading-relaxed text-text-muted">
                {lead.excerpt}
              </p>
            </Link>
          </Reveal>

          <div className="flex flex-col gap-6 lg:col-span-5">
            {rest.map((post, index) => (
              <Reveal key={post.id} delay={0.06 * (index + 1)}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="group/post flex items-start gap-4 border-t border-ink/10 pt-6 first:border-t-0 first:pt-0"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-mint sm:size-24">
                    <Image
                      src={post.coverImage}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 ease-verdant group-hover/post:scale-105"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="eyebrow">
                      {post.publishedAtLabel}
                    </p>
                    <h3 className="mt-1.5 font-heading text-[1.0625rem] leading-snug font-semibold tracking-[-0.015em] text-ink transition-colors duration-200 group-hover/post:text-forest">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 text-small text-text-muted">
                      {post.readMinutes} min read
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}

            <Reveal delay={0.2}>
              <Link
                href="/journal"
                className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium text-forest underline-offset-[6px] hover:underline"
              >
                Every post
                <ArrowRightIcon
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-verdant group-hover/link:translate-x-1"
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}