"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InboxIcon, MailIcon, MailOpenIcon, Trash2Icon } from "lucide-react";

import {
  deleteMessageAction,
  toggleMessageReadAction,
} from "@/app/actions/admin-messages";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import type { AdminContactMessage } from "@/lib/data/admin-messages";
import { CONTACT_TOPIC_LABELS } from "@/lib/validations/contact";

import { cn } from "cn";

/**
 * The front door's inbox, as a working list.
 *
 * The unread state is the row's headline fact — the oldest worry is the one
 * nobody has opened yet, so unread rows sit on a mint wash and the toggle is a
 * read/unread switch, decided server-side. Deleting asks for a moment of
 * confirmation, because the desk keeps what it decides to keep.
 */
export function MessagesList({ messages }: { messages: AdminContactMessage[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<AdminContactMessage | null>(null);

  async function toggleRead(message: AdminContactMessage) {
    const result = await toggleMessageReadAction({ id: message.id });

    if (result.success) {
      toast.success(message.read ? "Marked unread." : "Marked read.");
      router.refresh();
    } else {
      toast.error(result.error || "That switch did not take.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;

    const result = await deleteMessageAction({ id: deleting.id });

    if (result.success) {
      toast.success("Message deleted.", {
        description: `From ${deleting.name} — ${deleting.topic}`,
      });
      router.refresh();
    } else {
      toast.error(result.error || "We could not delete that message.");
    }
  }

  const columns: DataTableColumn<AdminContactMessage>[] = [
    {
      key: "from",
      header: "From",
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.name}</p>
          <p className="truncate text-small text-ink/50">{row.email}</p>
        </div>
      ),
    },
    {
      key: "topic",
      header: "Topic",
      sortValue: (row) => row.topic,
      cell: (row) => {
        const label =
          CONTACT_TOPIC_LABELS[row.topic as keyof typeof CONTACT_TOPIC_LABELS] ??
          row.topic;

        return (
          <span className="inline-flex min-h-6 items-center rounded-full border border-ink/10 bg-warm-white px-3 text-small text-ink/70">
            {label}
          </span>
        );
      },
    },
    {
      key: "message",
      header: "Message",
      cell: (row) => (
        <p className="max-w-md line-clamp-2 text-small text-ink/70">
          {row.message}
        </p>
      ),
    },
    {
      key: "received",
      header: "Received",
      sortValue: (row) => row.receivedLabel,
      cell: (row) => (
        <span className="whitespace-nowrap text-small text-ink/70">
          {row.receivedLabel}
        </span>
      ),
    },
    {
      key: "read",
      header: "Status",
      cell: (row) => (
        <button
          type="button"
          role="switch"
          aria-checked={row.read}
          aria-label={`Mark ${row.read ? "unread" : "read"}: message from ${row.name}`}
          onClick={() => void toggleRead(row)}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-small font-medium transition-colors duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            row.read
              ? "border-ink/15 bg-white text-ink/55"
              : "border-forest/30 bg-mint text-forest",
          )}
        >
          {row.read ? (
            <MailOpenIcon aria-hidden="true" className="size-4" />
          ) : (
            <MailIcon aria-hidden="true" className="size-4" />
          )}
          {row.read ? "Read" : "Unread"}
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={messages}
        rowKey={(row) => row.id}
        rowActions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleting(row)}
            aria-label={`Delete message from ${row.name}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon aria-hidden="true" className="size-4" />
            Delete
          </Button>
        )}
        empty={
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white px-6 py-16 text-center">
            <InboxIcon
              aria-hidden="true"
              className="size-8 text-ink/25"
              strokeWidth={1.75}
            />
            <p className="mt-3 text-sm font-medium text-ink">
              The front door is quiet
            </p>
            <p className="mt-1 text-small text-ink/50">
              When somebody writes in, the message lands here on the desk.
            </p>
          </div>
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete this message?"
        description={`The note from ${deleting?.name ?? ""} is removed for good — nothing is kept of it once it is gone.`}
        confirmLabel="Delete message"
        onConfirm={confirmDelete}
      />
    </>
  );
}