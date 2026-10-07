import "server-only";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

/*
  Journal queries for the back office.

  Unlike the storefront's `getJournalPosts`, these return drafts too — the
  whole point of the admin list is that unpublished posts are visible there and
  nowhere else.
*/

export type AdminJournalPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readMinutes: number;
  /** The post is visible on the storefront when false. */
  published: boolean;
  publishedAtLabel: string;
};

/** The full list a draft-aware view needs: drafts first, newest by dateline. */
export async function getAdminJournalPosts(): Promise<AdminJournalPost[]> {
  const rows = await prisma.journalPost.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      author: true,
      readMinutes: true,
      published: true,
      publishedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    author: row.author,
    readMinutes: row.readMinutes,
    published: row.published,
    publishedAtLabel: formatDate(row.publishedAt),
  }));
}

/** A post with its markdown source, for the edit form. Null when it is gone. */
export async function getJournalPostForEdit(id: string) {
  const row = await prisma.journalPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      author: true,
      readMinutes: true,
      published: true,
    },
  });

  if (!row) return null;

  return {
    ...row,
    readMinutes: row.readMinutes,
    published: row.published,
  };
}

/**
 * Whether a slug is already in use — by another post. The post being edited is
 * passed through so it does not collide with itself.
 */
export async function journalSlugIsTaken(
  slug: string,
  postId?: string,
): Promise<boolean> {
  const existing = await prisma.journalPost.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) return false;
  return existing.id !== postId;
}