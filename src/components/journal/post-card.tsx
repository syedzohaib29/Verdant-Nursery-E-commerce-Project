import Image from "next/image";
import Link from "next/link";

import type { JournalCard } from "@/lib/data/journal";

/**
 * One post in the journal grid.
 *
 * A masonry tile: the cover keeps the aspect it was given, and the copy below
 * it (date · reading time, title, a clipped excerpt) is the same on every tile
 * so the grid reads as one system even as the pictures vary. The whole tile is
 * one link — the image never gets its own target in the tab order.
 */
export function PostCard({
  post,
  aspectClassName,
}: {
  post: JournalCard;
  aspectClassName: string;
}) {
  return (
    <article className="group mb-6 break-inside-avoid">
      <Link href={`/journal/${post.slug}`}>
        <div
          className={`relative overflow-hidden rounded-xl bg-mint ${aspectClassName}`}
        >
          <Image
            src={post.coverImage}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-500 ease-verdant group-hover:scale-[1.03]"
          />
        </div>

        <div className="mt-4">
          <p className="text-small text-ink/55">
            {post.publishedAtLabel} · {post.readMinutes} min read
          </p>
          <h3 className="mt-1.5 font-heading text-xl font-semibold tracking-[-0.015em] text-ink transition-colors duration-200 group-hover:text-forest">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/70">
            {post.excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}