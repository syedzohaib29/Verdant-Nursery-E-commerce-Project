import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getAdminOrderStatusCounts,
  getOrdersForCsv,
  ordersToCsv,
} from "@/lib/data/admin-orders";
import { adminOrderFilterSchema } from "@/lib/validations/admin";

/*
  Order CSV export.

  The same filters as the order list, applied server-side: a filtered list is a
  question, and the CSV is the answer to it. The file is named with today's
  date so two exports a week apart do not overwrite each other in the downloads
  folder.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to export orders." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only an admin can export orders." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);

  const parsed = adminOrderFilterSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  // A mangled query string exports everything rather than nothing: the export
  // is a convenience, not a gate.
  const filters = parsed.success
    ? parsed.data
    : adminOrderFilterSchema.parse({});

  const [orders, counts] = await Promise.all([
    getOrdersForCsv({
      q: filters.q,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    }),
    getAdminOrderStatusCounts(),
  ]);

  const csv = ordersToCsv(orders);
  const date = new Date().toISOString().slice(0, 10);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="verdant-orders-${date}.csv"`,
      // The count is in the header so the UI can say "exported 32 orders"
      // without parsing the file it just downloaded.
      "X-Order-Count": String(total),
    },
  });
}
