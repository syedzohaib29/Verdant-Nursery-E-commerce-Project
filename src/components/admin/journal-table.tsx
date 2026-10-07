"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileTextIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  deleteJournalPostAction,
  toggleJournalPublishedAction,
} from "@/app/actions/admin-journal";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import type { AdminJournalPost } from "@/lib/data/admin-journal";

import { cn } from "cn";

/**
 * The journal, as a working list: cover, title, author, dateline and a
 * publish switch that makes a post appear on the storefront without opening
 * the editor. Row actions open the editor or ask for confirmation before a
 * delete.
 */
export function JournalTable({ posts }: { posts: AdminJournalPost[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleting, setDeleting] = useState<AdminJournalPost | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  async function togglePublished(post: AdminJournalPost) {
    setPendingSlug(post.slug);

    const result = await toggleJournalPublishedAction({ id: post.id });

    setPendingSlug(null);

    if (result.success) {
      toast.success(post.published ? "Post back to drafts." : "Post published.");
      router.refresh();
    } else {
      toast.error(result.error || "That switch did not take.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;

    const result = await deleteJournalPostAction({ id: deleting.id });

    if (result.success) {
      toast.success("Post deleted.", { description: deleting.title });
      if (pathname !== "/admin/journal") router.push("/admin/journal");
      router.refresh();
    } else {
      toast.error(result.error || "We could not delete that post.");
    }
  }

  const columns: DataTableColumn<AdminJournalPost>[] = [
    {
      key: "post",
      header: "Post",
      sortValue: (row) => row.title,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative hidden h-14 w-24 shrink-0 overflow-hidden rounded-md bg-mint sm:block">
            <Image
              src={row.coverImage}
              alt=""
              aria-hidden="true"
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.title}</p>
            <p className="truncate text-small text-ink/50">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      sortValue: (row) => row.author,
      cell: (row) => <span className="text-ink/75">{row.author}</span>,
    },
    {
      key: "read",
      header: "Read",
      numeric: true,
      sortValue: (row) => row.readMinutes,
      cell: (row) => (
        <span className="tabular-nums text-ink/75">{row.readMinutes} min</span>
      ),
    },
    {
      key: "dateline",
      header: "Dateline",
      sortValue: (row) => row.publishedAtLabel,
      cell: (row) => (
        <span className="whitespace-nowrap text-ink/75">
          {row.publishedAtLabel}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <button
          type="button"
          role="switch"
          aria-checked={row.published}
          aria-label={`${row.published ? "Unpublish" : "Publish"} “${row.title}”`}
          onClick={() => void togglePublished(row)}
          disabled={pendingSlug === row.slug}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-small font-medium transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
            row.published
              ? "border-forest/30 bg-mint text-forest"
              : "border-ink/15 bg-warm-white text-ink/60",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full",
              row.published ? "bg-forest" : "bg-ink/30",
            )}
          />
          {row.published ? "Published" : "Draft"}
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={posts}
        rowKey={(row) => row.id}
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/journal/${row.id}`} />}
              aria-label={`Edit ${row.title}`}
            >
              <PencilIcon aria-hidden="true" className="size-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleting(row)}
              aria-label={`Delete ${row.title}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon aria-hidden="true" className="size-4" />
              Delete
            </Button>
          </div>
        )}
        empty={
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white px-6 py-16 text-center">
            <FileTextIcon
              aria-hidden="true"
              className="size-8 text-ink/25"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm font-medium text-ink">
              No posts on the bench yet
            </p>
            <p className="mt-1 text-small text-ink/50">
              Write the first one — it becomes the journal&apos;s featured story.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/admin/journal/new" />}
              size="sm"
              className="mt-4"
            >
              New post
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete this post?"
        description={`“${deleting?.title ?? ""}” is removed for good — there is no draft bin. The URL stops working immediately.`}
        confirmLabel="Delete post"
        onConfirm={confirmDelete}
      />
    </>
  );
}