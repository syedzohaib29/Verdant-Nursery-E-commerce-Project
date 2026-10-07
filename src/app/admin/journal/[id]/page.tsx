import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { JournalForm } from "@/components/admin/journal-form";
import { PageHeader } from "@/components/admin/page-header";
import { getJournalPostForEdit } from "@/lib/data/admin-journal";

export const metadata: Metadata = {
  title: "Edit post",
};

/**
 * The edit form.
 *
 * The same form as create, pre-filled from the row — markdown source and all.
 * A missing post is a 404 rather than an empty form: editing something that is
 * not there is a broken link, not a new post.
 */
export default async function EditJournalPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const post = await getJournalPostForEdit(id);

  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/journal"
        className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
        All posts
      </Link>

      <PageHeader
        eyebrow="Community"
        title={post.title}
        description={`/${post.slug} · ${post.readMinutes} min read · ${
          post.published ? "published" : "a draft"
        }`}
      />

      <JournalForm post={post} />
    </div>
  );
}