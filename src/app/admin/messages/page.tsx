import type { Metadata } from "next";

import { MessagesList } from "@/components/admin/messages-list";
import { PageHeader } from "@/components/admin/page-header";
import {
  getAdminMessages,
  getUnreadMessageCount,
} from "@/lib/data/admin-messages";

export const metadata: Metadata = {
  title: "Messages",
};

/**
 * The front door's inbox.
 *
 * Every message the contact form has written, newest first. The unread count
 * in the headline is read from the same rows the list shows, so the two can
 * never disagree.
 */
export default async function AdminMessagesPage() {
  const [messages, unread] = await Promise.all([
    getAdminMessages(),
    getUnreadMessageCount(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Community"
        title="Messages"
        description={
          unread > 0
            ? `${unread} unread ${unread === 1 ? "message" : "messages"} waiting on the desk.`
            : "All caught up — every message has been read."
        }
      />

      <MessagesList messages={messages} />
    </div>
  );
}