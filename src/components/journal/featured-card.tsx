import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { JournalCard } from "@/lib/data/journal";

/**
 * The newest post, dressed as the magazine cover of the issue.
 *
 * A wide photograph with a white meta card overlapping its lower corner — the
 * one deliberate overlap on the page. The initials in the card come from the
 * author's name so a hand whose photo never made it into the system still has
 * a face on the bench.
 */
export function FeaturedCard({ post }: { post: JournalCard }) {
  const initials = post.author
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="group">
      <Link
        href={`/journal/${post.slug}`}
        className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10"
      >
        <div className="relative lg:col-span-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-mint">
            <Image
              src={post.coverImage}
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="(min-width: 1024px) 62vw, 92vw"
              className="object-cover transition-transform duration-500 ease-verdant group-hover:scale-[1.02]"
            />
          </div>

          {/* The overlapping meta card */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 shadow-lift lg:-bottom-6 lg:left-8">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-mint font-heading text-sm font-semibold text-forest"
            >
              {initials}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{post.author}</p>
              <p className="text-xs text-ink/55">
                {post.publishedAtLabel} · {post.readMinutes} min read
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 lg:pb-2">
          <p className="eyebrow">Fresh off the bench</p>
          <h2 className="mt-3 font-heading text-h3 font-semibold tracking-[-0.02em] text-ink">
            {post.title}
          </h2>
          <p className="mt-3 text-pretty text-body leading-relaxed text-ink/70">
            {post.excerpt}
          </p>
          <span className="mt-5 inline-flex h-11 items-center gap-2 text-small font-medium text-forest">
            Read the post
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}