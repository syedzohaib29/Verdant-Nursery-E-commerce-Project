import type { Metadata } from "next";

import { CategoryTable } from "@/components/admin/category-table";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminCategories } from "@/lib/data/admin-categories";

export const metadata: Metadata = {
  title: "Categories",
};

/**
 * The shelves, as a table with a dialog form.
 *
 * A category is five fields, so the form lives in a dialog rather than a page.
 * The table shows the image, the name, the slug, the sort order and the product
 * count — the count is what decides whether a category can be deleted.
 */
export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description={`${categories.length} shelves on the shop page.`}
      />

      <CategoryTable categories={categories} />
    </div>
  );
}
