"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/actions/admin-categories";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/utils";
import { categorySchema } from "@/lib/validations/product";

/**
 * The category create/edit dialog.
 *
 * A dialog rather than a page because a category is five fields — a whole page
 * for that is a walk to change one word. The image is a URL with a live
 * preview, so the person editing can see what the shelf will look like before
 * saving.
 */

type FormValues = z.infer<typeof categorySchema>;

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    sortOrder: number;
  } | null;
}) {
  const router = useRouter();
  const isEdit = category !== null;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
        }
      : { name: "", slug: "", description: "", image: "", sortOrder: 0 },
    mode: "onTouched",
  });

  const image = watch("image");
  const name = watch("name");
  const slug = watch("slug");

  // Auto-generate the slug from the name the same way the product form does:
  // it keeps filling until the person edits the slug themselves, then gets out
  // of the way.
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState(
    category?.slug ?? "",
  );

  useEffect(() => {
    const generated = slugify(name);
    if (generated && (slug === "" || slug === lastGeneratedSlug)) {
      setValue("slug", generated, { shouldValidate: true });
      setLastGeneratedSlug(generated);
    }
  }, [name, slug, lastGeneratedSlug, setValue]);

  async function onSubmit(values: FormValues) {
    setSaving(true);

    const result = isEdit
      ? await updateCategoryAction({ ...values, id: category.id })
      : await createCategoryAction(values);

    setSaving(false);

    if (!result.success) {
      if (result.fieldErrors.slug) {
        setError("slug", { message: result.fieldErrors.slug[0] });
      }
      if (result.fieldErrors.name) {
        setError("name", { message: result.fieldErrors.name[0] });
      }
      toast.error(result.error || "Check the form and try again.");
      return;
    }

    toast.success(isEdit ? "Shelf saved." : "Shelf created.");
    onOpenChange(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit shelf" : "New shelf"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Rename it, reorder it, or change its photograph."
              : "A new shelf for the shop page."}
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Field invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="cat-name">Name</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="cat-name"
                  autoComplete="off"
                  placeholder="Indoor Plants"
                  {...register("name")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.name)}>
              {errors.name?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.slug)}>
            <FieldLabel htmlFor="cat-slug">Slug</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="cat-slug"
                  autoComplete="off"
                  placeholder="indoor-plants"
                  {...register("slug")}
                />
              }
            />
            <FieldDescription>
              The URL segment. Generated from the name — lowercase words joined
              by hyphens.
            </FieldDescription>
            <AnimatedFieldError show={Boolean(errors.slug)}>
              {errors.slug?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="cat-description">Description</FieldLabel>
            <FieldControl
              render={
                <textarea
                  id="cat-description"
                  rows={3}
                  placeholder="What belongs on this shelf…"
                  className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-body text-ink transition-[color,border-color,background-color] duration-200 ease-verdant outline-none placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  {...register("description")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.description)}>
              {errors.description?.message}
            </AnimatedFieldError>
          </Field>

          <Field invalid={Boolean(errors.image)}>
            <FieldLabel htmlFor="cat-image">Image URL</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="cat-image"
                  autoComplete="off"
                  placeholder="/images/category-indoor-plants.webp"
                  {...register("image")}
                />
              }
            />
            <AnimatedFieldError show={Boolean(errors.image)}>
              {errors.image?.message}
            </AnimatedFieldError>
          </Field>

          {/* Live preview of the shelf image. */}
          {image ? (
            <div className="relative aspect-[3/1] overflow-hidden rounded-lg bg-mint">
              <Image
                src={image}
                alt="Category image preview"
                fill
                sizes="(min-width: 640px) 512px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <Field invalid={Boolean(errors.sortOrder)}>
            <FieldLabel htmlFor="cat-sort">Sort order</FieldLabel>
            <FieldControl
              render={
                <Input
                  id="cat-sort"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  {...register("sortOrder", { valueAsNumber: true })}
                />
              }
            />
            <FieldDescription>
              Lower numbers render first. Ties break by name.
            </FieldDescription>
            <AnimatedFieldError show={Boolean(errors.sortOrder)}>
              {errors.sortOrder?.message}
            </AnimatedFieldError>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving || isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving || isSubmitting}>
              {isEdit ? "Save shelf" : "Create shelf"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
