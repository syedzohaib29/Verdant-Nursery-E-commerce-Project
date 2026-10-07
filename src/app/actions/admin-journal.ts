"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import {
  getJournalPostForEdit,
  journalSlugIsTaken,
} from "@/lib/data/admin-journal";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  journalPostIdSchema,
  journalPostSchema,
} from "@/lib/validations/admin";

/*
  Journal actions.

  The same three questions as every other back-office action: who is asking (an
  ADMIN), is the input real (Zod — and the slug must not collide with another
  post's URL), and does it work, returning
  { success, error, fieldErrors } so the form can report it without guessing.

  `publishedAt` is required by the schema and set to now at creation; flipping
  a draft to published re-stamps it so the storefront's "newest first" order
  reflects when it actually went live, not when it was written.
*/

export type JournalActionResult = {
  success: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
  postId?: string;
};

const FAILED = (error: string): JournalActionResult => ({
  success: false,
  error,
  fieldErrors: {},
});

/** The ADMIN check every action in this file starts with. */
async function requireAdmin(): Promise<string | null> {
  const session = await auth();

  if (!session?.user) return "Sign in to make that change.";
  if (session.user.role !== "ADMIN")
    return "Only an admin can edit the journal.";

  return null;
}

function revalidateJournal() {
  revalidatePath("/admin/journal");
  revalidatePath("/journal");
  revalidatePath("/");
}

/** Whether a slug needs to be checked before a create or a save. */
async function slugCollides(slug: string, postId?: string): Promise<boolean> {
  return journalSlugIsTaken(slug, postId);
}

export async function createJournalPostAction(
  input: unknown,
): Promise<JournalActionResult> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = journalPostSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const slug = data.slug || slugify(data.title);

  if (await slugCollides(slug)) {
    return {
      success: false,
      error: "That slug is already taken.",
      fieldErrors: { slug: ["Another post already uses that URL."] },
    };
  }

  const post = await prisma.journalPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage,
      author: data.author,
      readMinutes: data.readMinutes,
      publishedAt: new Date(),
      published: data.published,
    },
    select: { id: true },
  });

  revalidateJournal();
  return { success: true, error: "", fieldErrors: {}, postId: post.id };
}

export async function updateJournalPostAction(
  input: unknown,
): Promise<JournalActionResult> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = journalPostSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const postId = data.id;

  if (!postId) {
    return {
      success: false,
      error: "That post could not be read.",
      fieldErrors: { id: ["That post could not be read."] },
    };
  }

  const slug = data.slug || slugify(data.title);

  if (await slugCollides(slug, postId)) {
    return {
      success: false,
      error: "That slug is already taken.",
      fieldErrors: { slug: ["Another post already uses that URL."] },
    };
  }

  const current = await getJournalPostForEdit(postId);
  if (!current) return FAILED("That post is gone.");

  // Re-stamp the dateline only when a draft actually goes live. Writing more
  // words should not make an old post look new.
  const publishedAt =
    !current.published && data.published ? new Date() : undefined;

  await prisma.journalPost.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage,
      author: data.author,
      readMinutes: data.readMinutes,
      published: data.published,
      ...(publishedAt ? { publishedAt } : {}),
    },
  });

  revalidateJournal();
  revalidatePath(`/journal/${slug}`);
  return { success: true, error: "", fieldErrors: {}, postId };
}

export async function deleteJournalPostAction(
  input: unknown,
): Promise<JournalActionResult> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = journalPostIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "That post could not be read.",
      fieldErrors: {},
    };
  }

  const post = await prisma.journalPost.findUnique({
    where: { id: parsed.data.id },
    select: { slug: true },
  });

  if (!post) return FAILED("That post is gone.");

  await prisma.journalPost.delete({ where: { id: parsed.data.id } });

  revalidateJournal();
  revalidatePath(`/journal/${post.slug}`);
  return { success: true, error: "", fieldErrors: {}, postId: parsed.data.id };
}

/**
 * Flip a post between draft and published. The new state is decided here from
 * the row, not sent by the client, so the checkbox cannot lie.
 */
export async function toggleJournalPublishedAction(
  input: unknown,
): Promise<JournalActionResult> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = journalPostIdSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "That post could not be read.",
      fieldErrors: {},
    };
  }

  const current = await prisma.journalPost.findUnique({
    where: { id: parsed.data.id },
    select: { published: true, slug: true },
  });

  if (!current) return FAILED("That post is gone.");

  await prisma.journalPost.update({
    where: { id: parsed.data.id },
    data: {
      published: !current.published,
      ...(current.published ? {} : { publishedAt: new Date() }),
    },
  });

  revalidateJournal();
  return { success: true, error: "", fieldErrors: {} };
}

/** Whether a slug is free, for the form's live check. */
export async function checkJournalSlugAction(
  input: unknown,
): Promise<{ available: boolean }> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { available: false };

  const parsed = journalPostIdSchema
    .extend({
      slug: z
        .string()
        .trim()
        .min(2)
        .max(160)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      postId: z.string().cuid().optional(),
    })
    .safeParse(input);

  if (!parsed.success) return { available: false };

  const taken = await journalSlugIsTaken(
    parsed.data.slug,
    parsed.data.postId,
  );

  return { available: !taken };
}