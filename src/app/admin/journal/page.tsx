import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { JournalTable } from "@/components/admin/journal-table";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminJournalPosts } from "@/lib/data/admin-journal";

export const metadata: Metadata = {
  title: "Journal posts",
};

/**
 * The journal desk.
 *
 * Drafts and published posts sit side by side here — the only place an
 * unpublished post is visible at all. The publish switch on each row moves a
 * post straight to the storefront; everything else lives in the editor.
 */
export default async function AdminJournalPage() {
  const posts = await getAdminJournalPosts();

  const publishedCount = posts.filter((post) => post.published).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Community"
        title="Journal"
        description={`${posts.length} ${
          posts.length === 1 ? "post" : "posts"
        } on the bench, ${publishedCount} live.`}
        actions={
          <Link
            href="/admin/journal/new"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-forest px-4 text-sm font-medium text-white outline-none transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <PlusIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
            New post
          </Link>
        }
      />

      <JournalTable posts={posts} />
    </div>
  );
}