import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/page-header";
import { ReviewsTabs } from "@/components/admin/reviews-tabs";
import type { AdminReview } from "@/components/admin/review-card";
import { getPendingReviews } from "@/lib/data/reviews";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reviews",
};

/**
 * The moderation queue.
 *
 * The page only fetches — the tabs, the optimistic approve/delete and the
 * counts live in the client container below. The approved tab is where you
 * unpublish something that should not have gone live; the pending tab is the
 * day's actual work.
 */
export default async function AdminReviewsPage() {
  const [pending, approvedRows] = await Promise.all([
    getPendingReviews(50),
    prisma.review.findMany({
      where: { approved: true },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const pendingCards: AdminReview[] = pending.map((row) => ({
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: row.authorName,
    verifiedPurchase: row.verifiedPurchase,
    createdAt: row.createdAt,
    createdAtLabel: row.createdAtLabel,
    productName: row.productName,
    productSlug: row.productSlug,
    approved: row.approved,
  }));

  const approvedCards: AdminReview[] = approvedRows.map((row) => ({
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: row.user.name,
    verifiedPurchase: false,
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(row.createdAt),
    productName: row.product.name,
    productSlug: row.product.slug,
    approved: true,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Community"
        title="Reviews"
        description={`${pendingCards.length} waiting for moderation.`}
      />

      <ReviewsTabs pending={pendingCards} approved={approvedCards} />
    </div>
  );
}
