import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoryOptions } from "@/lib/data/categories";
import { getProductForEdit } from "@/lib/data/admin-products";

export const metadata: Metadata = {
  title: "Edit product",
};

/**
 * The edit form.
 *
 * The same form as create, pre-filled from the row. A missing product is a
 * 404 rather than an empty form — editing something that is not there is a
 * broken link, not a new product.
 */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductForEdit(id),
    getCategoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/products"
        className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
        All products
      </Link>

      <PageHeader
        eyebrow="Catalogue"
        title={product.name}
        description={`SKU ${product.sku} · ${product.stock} in stock · ${
          product.isActive ? "on the shelf" : "a draft"
        }`}
      />

      <ProductForm product={product} categories={categories} />
    </div>
  );
}
