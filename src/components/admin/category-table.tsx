"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FolderIcon } from "lucide-react";

import { CategoryDialog } from "@/components/admin/category-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteCategoryAction } from "@/app/actions/admin-categories";
import { Button } from "@/components/ui/button";
import type { AdminCategoryRow } from "@/lib/data/admin-categories";

/**
 * The category table, with its dialog state.
 *
 * A client component because the create/edit dialog and the delete confirm are
 * interactive. The data arrives from the server page already fetched, so this
 * component only owns which dialog is open and what it is editing.
 */
export function CategoryTable({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);

  async function deleteCategory(categoryId: string) {
    const result = await deleteCategoryAction({ categoryId });

    if (result.success) {
      toast.success("Shelf deleted.");
    } else {
      toast.error(result.error || "We could not delete that shelf.");
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 bg-white px-6 py-16 text-center">
        <FolderIcon
          aria-hidden="true"
          className="size-8 text-ink/25"
          strokeWidth={1.5}
        />
        <p className="mt-3 text-sm font-medium text-ink">No shelves yet</p>
        <p className="mt-1 text-small text-ink/50">
          Create the first one to start organising the catalogue.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-4"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          New shelf
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          New shelf
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        <ul className="divide-y divide-ink/10">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-4 px-5 py-4">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mint">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-ink">{category.name}</p>
                <p className="mt-0.5 text-xs text-ink/45">
                  /{category.slug} · sort {category.sortOrder}
                </p>
              </div>

              <p className="hidden text-sm text-ink/60 tabular-nums sm:block">
                {category.productCount}{" "}
                {category.productCount === 1 ? "product" : "products"}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(category);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <ConfirmDialog
                  title={`Delete “${category.name}”?`}
                  description={
                    category.productCount > 0
                      ? `It still has ${category.productCount} ${
                          category.productCount === 1 ? "product" : "products"
                        } in it. Move them to another shelf first.`
                      : "It has no products in it. This cannot be undone."
                  }
                  confirmLabel="Delete shelf"
                  onConfirm={() => void deleteCategory(category.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${category.name}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Delete
                    </Button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />
    </>
  );
}
