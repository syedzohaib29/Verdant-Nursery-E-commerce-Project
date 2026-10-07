import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "New product",
};

/**
 * The create form.
 *
 * The same form as edit, with no product — the form starts empty and the
 * images section waits for the first save, because an image needs a product to
 * belong to.
 */
export default async function NewProductPage() {
  const categories = await getCategoryOptions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="New product"
        description="Add a plant to the shelves. You can add photographs once it is saved."
      />

      <ProductForm product={null} categories={categories} />
    </div>
  );
}
