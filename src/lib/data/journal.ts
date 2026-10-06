import "server-only";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

/*
  Journal queries.

  Posts are stored as Markdown source, never as HTML. Rendering happens on the
  server at read time, so there is no stored markup to sanitise and no way for a
  post to ship a script tag.
*/

export type JournalCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readMinutes: number;
  publishedAt: string;
  publishedAtLabel: string;
};

export type JournalPost = JournalCard & {
  content: string;
};

/**
 * Published posts, newest first. `published: false` is filtered in the query so
 * a draft is not reachable by guessing its slug.
 */
export async function getJournalPosts(
  options: { limit?: number; excludeSlug?: string } = {},
): Promise<JournalCard[]> {
  const rows = await prisma.journalPost.findMany({
    where: {
      published: true,
      ...(options.excludeSlug ? { slug: { not: options.excludeSlug } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      author: true,
      readMinutes: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
    take: options.limit,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    author: row.author,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt.toISOString(),
    publishedAtLabel: formatDate(row.publishedAt),
  }));
}

export async function getJournalPostBySlug(
  slug: string,
): Promise<JournalPost | null> {
  const row = await prisma.journalPost.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      author: true,
      readMinutes: true,
      publishedAt: true,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    author: row.author,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt.toISOString(),
    publishedAtLabel: formatDate(row.publishedAt),
  };
}

/**
 * Anything else worth reading, for the end of a post. Falls back to the newest
 * posts when the current one is the only thing published.
 */
export async function getRelatedPosts(
  currentSlug: string,
  limit = 3,
): Promise<JournalCard[]> {
  const related = await getJournalPosts({ limit: limit + 4 });

  const others = related.filter((post) => post.slug !== currentSlug);

  if (others.length > 0) return others.slice(0, limit);

  // Fall back to older posts, excluding the current one.
  const older = await prisma.journalPost.findMany({
    where: { published: true, slug: { not: currentSlug } },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      author: true,
      readMinutes: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "asc" },
    take: limit,
  });

  return older.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    author: row.author,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt.toISOString(),
    publishedAtLabel: formatDate(row.publishedAt),
  }));
}
