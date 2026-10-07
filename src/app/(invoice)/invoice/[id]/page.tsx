import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { auth } from "@/auth";
import { Invoice } from "@/components/admin/invoice";
import { PrintButton } from "@/components/admin/print-button";
import { getOrderById } from "@/lib/data/orders";

export const metadata: Metadata = {
  title: "Invoice",
};

type Props = { params: Promise<{ id: string }> };

/**
 * A printable invoice for one order.
 *
 * Same guard as every admin page: the proxy bounces guests, this one bounces
 * non-admins. Rendered in its own route group, so none of the admin chrome
 * surrounds the document — the slim bar below is hidden when printed.
 */
export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invoice/${id}`)}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const order = await getOrderById(id);

  if (!order) notFound();

  return (
    <>
      {/* Utility bar — hidden when the document is printed. */}
      <div className="border-b border-ink/10 bg-white print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6 sm:px-10">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
            Back to order
          </Link>
          <PrintButton />
        </div>
      </div>

      <Invoice order={order} />
    </>
  );
}
