import "server-only";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

/*
  The front door's inbox.

  Same data the storefront's contact form writes, read back for the back
  office: newest first, unread marked, everything a message desk needs without
  shipping the whole body twice.
*/

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  read: boolean;
  receivedLabel: string;
};

export async function getAdminMessages(): Promise<AdminContactMessage[]> {
  const rows = await prisma.contactMessage.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    message: row.message,
    read: row.read,
    receivedLabel: formatDate(row.createdAt, true),
  }));
}

/** How many messages nobody has opened yet — for the desk's count. */
export async function getUnreadMessageCount(): Promise<number> {
  return prisma.contactMessage.count({ where: { read: false } });
}