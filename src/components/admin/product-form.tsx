"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckIcon, Loader2Icon } from "lucide-react";

import {
  checkSlugAction,
  createProductAction,
  updateProductAction,
} from "@/app/actions/admin-products";
import { Button } from "@/components/ui/button";
import {
  AnimatedFieldError,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/admin/money-input";
import { ProductImageManager, type ProductImage } from "@/components/admin/product-images";
import { UnsavedChangesBar } from "@/components/admin/unsaved-changes-bar";
import { slugify } from "@/lib/utils";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DIFFICULTY_LABELS,
  LIGHT_LEVEL_LABELS,
  WATER_LEVEL_LABELS,
  type Difficulty,
  type LightLevel,
  type WaterLevel,
} from "@/lib/constants";
import { z } from "zod";

import { productSchema } from "@/lib/validations/product";

type FormValues = z.infer<typeof productSchema>;

const SECTIONS = [
  { id: "basics", label: "Basics" },
  { id: "pricing", label: "Pricing" },
  { id: "inventory", label: "Inventory" },
  { id: "care", label: "Care details" },
  { id: "category", label: "Category" },
  { id: "visibility", label: "Visibility" },
  { id: "images", label: "Images" },
] as const;

/** The care pickers' options, straight from the constants so they can never drift. */
const LIGHT_ITEMS = Object.entries(LIGHT_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const WATER_ITEMS = Object.entries(WATER_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const DIFFICULTY_ITEMS = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function ProductForm({
  product,
  categories,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    salePriceCents: number | null;
    stock: number;
    sku: string;
    categoryId: string;
    featured: boolean;
    light: LightLevel;
    water: WaterLevel;
    petSafe: boolean;
    difficulty: Difficulty;
    heightCm: number | null;
    careNotes: string;
    isActive: boolean;
    images: ProductImage[];
  } | null;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const isEdit = product !== null;
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugChecked, setSlugChecked] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceDollars: product.priceCents / 100,
          salePriceDollars: product.salePriceCents != null ? product.salePriceCents / 100 : null,
          stock: product.stock,
          sku: product.sku,
          categoryId: product.categoryId,
          featured: product.featured,
          light: product.light,
          water: product.water,
          petSafe: product.petSafe,
          difficulty: product.difficulty,
          heightCm: product.heightCm,
          careNotes: product.careNotes,
          isActive: product.isActive,
        }
      : {
          name: "",
          slug: "",
          description: "",
          priceDollars: 0,
          salePriceDollars: null,
          stock: 0,
          sku: "",
          categoryId: categories[0]?.id ?? "",
          featured: false,
          light: "MEDIUM",
          water: "MODERATE",
          petSafe: false,
          difficulty: "EASY",
          heightCm: null,
          careNotes: "",
          isActive: true,
        },
    mode: "onTouched",
  });

  const name = watch("name");
  const slug = watch("slug");
  const priceDollars = watch("priceDollars");
  const salePriceDollars = watch("salePriceDollars");

  // Auto-generate the slug from the name when the slug field is empty or
  // matches the last generated value (i.e. the user hasn't edited it).
  const [lastGeneratedSlug, setLastGeneratedSlug] = useState("");

  useEffect(() => {
    const generated = slugify(name);
    if (generated && (slug === "" || slug === lastGeneratedSlug)) {
      setValue("slug", generated, { shouldValidate: true });
      setLastGeneratedSlug(generated);
    }
  }, [name, slug, lastGeneratedSlug, setValue]);

  // Check slug uniqueness on blur, but only when it has changed.
  async function handleSlugBlur() {
    if (!slug || slug === slugChecked) return;

    setSlugStatus("checking");
    setSlugChecked(slug);

    const result = await checkSlugAction({
      slug,
      productId: product?.id,
    });

    setSlugStatus(result.available ? "available" : "taken");
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);

    const payload = {
      ...values,
      ...(product ? { id: product.id } : {}),
    };

    const result = isEdit
      ? await updateProductAction(payload)
      : await createProductAction(payload);

    setSaving(false);

    if (!result.success) {
      const fieldErrors = result.fieldErrors;

      if (fieldErrors.name) {
        setError("name", { message: fieldErrors.name[0] });
      }
      if (fieldErrors.slug) {
        setError("slug", { message: fieldErrors.slug[0] });
      }
      if (fieldErrors.sku) {
        setError("sku", { message: fieldErrors.sku[0] });
      }
      if (fieldErrors.categoryId) {
        setError("categoryId", { message: fieldErrors.categoryId[0] });
      }

      const firstField = Object.keys(fieldErrors)[0];
      if (firstField) {
        const el = formRef.current?.querySelector(`[name="${firstField}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      toast.error(result.error || "Check the form and try again.");
      return;
    }

    toast.success(isEdit ? "Product saved." : "Product created.");

    if (!isEdit && "productId" in result && result.productId) {
      router.push(`/admin/products/${result.productId}`);
    } else {
      reset(values);
    }
  }

  function discard() {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceDollars: product.priceCents / 100,
        salePriceDollars: product.salePriceCents != null ? product.salePriceCents / 100 : null,
        stock: product.stock,
        sku: product.sku,
        categoryId: product.categoryId,
        featured: product.featured,
        light: product.light,
        water: product.water,
        petSafe: product.petSafe,
        difficulty: product.difficulty,
        heightCm: product.heightCm,
        careNotes: product.careNotes,
        isActive: product.isActive,
      });
    } else {
      reset({
        name: "",
        slug: "",
        description: "",
        priceDollars: 0,
        salePriceDollars: null,
        stock: 0,
        sku: "",
        categoryId: categories[0]?.id ?? "",
        featured: false,
        light: "MEDIUM",
        water: "MODERATE",
        petSafe: false,
        difficulty: "EASY",
        heightCm: null,
        careNotes: "",
        isActive: true,
      });
    }
    toast.info("Changes discarded.");
  }

  const onSale = salePriceDollars != null && salePriceDollars > 0;
  const saleValid = salePriceDollars == null || salePriceDollars < priceDollars;

  return (
    // grid-cols-1 at the base stops the section nav's max-content width from
    // widening the whole page on a phone; at lg the two columns take over.
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
      {/* Section nav: sticky on desktop, a horizontal scroll on mobile. */}
      <nav
        aria-label="Form sections"
        className="lg:sticky lg:top-24 lg:self-start"
      >
        <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
          {SECTIONS.map((section) => (
            <li key={section.id} className="shrink-0 lg:shrink">
              <a
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-ink/60 transition-colors duration-200 hover:bg-ink/[0.04] hover:text-ink lg:whitespace-normal"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        {/* ------------------------------ Basics ------------------------------ */}
        <section id="basics" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Basics</h2>
          <p className="mt-1 text-small text-ink/55">
            The name and how the plant introduces itself.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            <Field invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="pf-name">Name</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="pf-name"
                    autoComplete="off"
                    placeholder="Monstera Deliciosa"
                    {...register("name")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.name)}>
                {errors.name?.message}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.slug) || slugStatus === "taken"}>
              <FieldLabel htmlFor="pf-slug">Slug</FieldLabel>
              <FieldControl
                render={
                  <div className="relative">
                    <Input
                      id="pf-slug"
                      autoComplete="off"
                      placeholder="monstera-deliciosa"
                      className="pr-10"
                      {...register("slug", {
                        onBlur: () => {
                          void handleSlugBlur();
                        },
                      })}
                    />
                    {slugStatus === "checking" ? (
                      <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-ink/40" />
                    ) : slugStatus === "available" ? (
                      <CheckIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-forest" />
                    ) : null}
                  </div>
                }
              />
              <FieldDescription>
                The URL on the shop. Generated from the name — edit it only if you
                mean to.
              </FieldDescription>
              <AnimatedFieldError show={Boolean(errors.slug) || slugStatus === "taken"}>
                {errors.slug?.message ??
                  (slugStatus === "taken" ? "That slug is already taken." : null)}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="pf-description">Description</FieldLabel>
              <FieldControl
                render={
                  <textarea
                    id="pf-description"
                    rows={5}
                    placeholder="What makes this plant worth the shelf space…"
                    className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-body text-ink transition-[color,border-color,background-color] duration-200 ease-verdant outline-none placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    {...register("description")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.description)}>
                {errors.description?.message}
              </AnimatedFieldError>
            </Field>
          </div>
        </section>

        {/* ------------------------------ Pricing ----------------------------- */}
        <section id="pricing" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Pricing</h2>
          <p className="mt-1 text-small text-ink/55">
            What the plant costs, and what it costs on promotion.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field invalid={Boolean(errors.priceDollars)}>
              <FieldLabel htmlFor="pf-price">Price</FieldLabel>
              <MoneyInput
                id="pf-price"
                label=""
                value={Math.round(priceDollars * 100)}
                onChange={(cents) =>
                  setValue("priceDollars", cents == null ? 0 : cents / 100, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <AnimatedFieldError show={Boolean(errors.priceDollars)}>
                {errors.priceDollars?.message}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.salePriceDollars) || (onSale && !saleValid)}>
              <FieldLabel htmlFor="pf-sale">Sale price (optional)</FieldLabel>
              <MoneyInput
                id="pf-sale"
                label=""
                value={salePriceDollars != null ? Math.round(salePriceDollars * 100) : null}
                onChange={(cents) =>
                  setValue("salePriceDollars", cents == null ? null : cents / 100, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                hint={
                  onSale && saleValid
                    ? `Was $${priceDollars.toFixed(2)} — now $${salePriceDollars.toFixed(2)}.`
                    : "Leave empty when the plant is not on promotion."
                }
              />
              <AnimatedFieldError show={Boolean(errors.salePriceDollars) || (onSale && !saleValid)}>
                {errors.salePriceDollars?.message ??
                  (onSale && !saleValid
                    ? "A sale price has to be lower than the full price."
                    : null)}
              </AnimatedFieldError>
            </Field>
          </div>
        </section>

        {/* ----------------------------- Inventory ---------------------------- */}
        <section id="inventory" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Inventory</h2>
          <p className="mt-1 text-small text-ink/55">
            How many are on the shelf, and the code the shelf uses.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field invalid={Boolean(errors.stock)}>
              <FieldLabel htmlFor="pf-stock">Stock</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="pf-stock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    {...register("stock", { valueAsNumber: true })}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.stock)}>
                {errors.stock?.message}
              </AnimatedFieldError>
            </Field>

            <Field invalid={Boolean(errors.sku)}>
              <FieldLabel htmlFor="pf-sku">SKU</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="pf-sku"
                    autoComplete="off"
                    placeholder="VRD-IND-1001"
                    {...register("sku")}
                  />
                }
              />
              <FieldDescription>
                Letters, numbers and hyphens. Unique across the catalogue.
              </FieldDescription>
              <AnimatedFieldError show={Boolean(errors.sku)}>
                {errors.sku?.message}
              </AnimatedFieldError>
            </Field>
          </div>
        </section>

        {/* ------------------------------- Care ------------------------------- */}
        <section id="care" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Care details</h2>
          <p className="mt-1 text-small text-ink/55">
            What the plant needs to survive a real room.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pf-light">Light</FieldLabel>
              <FieldControl
                render={
                  <Select
                    value={watch("light")}
                    onValueChange={(value) =>
                      setValue("light", value as LightLevel, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    items={LIGHT_ITEMS}
                  >
                    <SelectTrigger id="pf-light" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHT_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="pf-water">Water</FieldLabel>
              <FieldControl
                render={
                  <Select
                    value={watch("water")}
                    onValueChange={(value) =>
                      setValue("water", value as WaterLevel, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    items={WATER_ITEMS}
                  >
                    <SelectTrigger id="pf-water" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WATER_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="pf-difficulty">Difficulty</FieldLabel>
              <FieldControl
                render={
                  <Select
                    value={watch("difficulty")}
                    onValueChange={(value) =>
                      setValue("difficulty", value as Difficulty, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    items={DIFFICULTY_ITEMS}
                  >
                    <SelectTrigger id="pf-difficulty" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="pf-height">Mature height (cm, optional)</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="pf-height"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    placeholder="90"
                    {...register("heightCm", { valueAsNumber: true })}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.heightCm)}>
                {errors.heightCm?.message}
              </AnimatedFieldError>
            </Field>
          </div>

          <div className="mt-5">
            <Field invalid={Boolean(errors.careNotes)}>
              <FieldLabel htmlFor="pf-care">Care notes</FieldLabel>
              <FieldControl
                render={
                  <textarea
                    id="pf-care"
                    rows={4}
                    placeholder="Water when the top 5cm of soil is dry…"
                    className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-body text-ink transition-[color,border-color,background-color] duration-200 ease-verdant outline-none placeholder:text-ink/45 focus-visible:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    {...register("careNotes")}
                  />
                }
              />
              <AnimatedFieldError show={Boolean(errors.careNotes)}>
                {errors.careNotes?.message}
              </AnimatedFieldError>
            </Field>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1">
            <input
              type="checkbox"
              className="size-4 rounded border-ink/25 accent-forest"
              {...register("petSafe")}
            />
            <span className="text-[0.9375rem] text-ink/80">
              Pet-safe (non-toxic to cats and dogs)
            </span>
          </label>
        </section>

        {/* ----------------------------- Category ----------------------------- */}
        <section id="category" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Category</h2>
          <p className="mt-1 text-small text-ink/55">
            Which shelf the plant lives on.
          </p>

          <div className="mt-5">
            <Field invalid={Boolean(errors.categoryId)}>
              <FieldLabel htmlFor="pf-category">Category</FieldLabel>
              <FieldControl
                render={
                  <Select
                    value={watch("categoryId")}
                    onValueChange={(value) => {
                      if (value == null) return;
                      setValue("categoryId", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    items={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  >
                    <SelectTrigger id="pf-category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
              <AnimatedFieldError show={Boolean(errors.categoryId)}>
                {errors.categoryId?.message}
              </AnimatedFieldError>
            </Field>
          </div>
        </section>

        {/* ---------------------------- Visibility ---------------------------- */}
        <section id="visibility" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Visibility</h2>
          <p className="mt-1 text-small text-ink/55">
            Whether the plant is on the shelf and whether it is featured.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-warm-white px-4">
              <input
                type="checkbox"
                className="size-4 rounded border-ink/25 accent-forest"
                {...register("isActive")}
              />
              <span className="text-[0.9375rem] text-ink/80">
                Active — visible on the shop
              </span>
            </label>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-warm-white px-4">
              <input
                type="checkbox"
                className="size-4 rounded border-ink/25 accent-forest"
                {...register("featured")}
              />
              <span className="text-[0.9375rem] text-ink/80">
                Featured — appears on the home page
              </span>
            </label>
          </div>
        </section>

        {/* ------------------------------ Images ------------------------------ */}
        <section id="images" className="scroll-mt-24 rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Images</h2>
          <p className="mt-1 text-small text-ink/55">
            The photographs the shop shows. The first one is the cover.
          </p>

          <div className="mt-5">
            {product ? (
              <ProductImageManager productId={product.id} images={product.images} />
            ) : (
              <p className="rounded-lg border border-dashed border-ink/20 bg-warm-white px-4 py-6 text-center text-small text-ink/50">
                Save the product first, then add photographs.
              </p>
            )}
          </div>
        </section>

        {/* ------------------------------ Actions ----------------------------- */}
        {/* The unsaved-changes bar parks over the bottom of the page whenever
            the form is dirty, so the row keeps a clearing that fits under it. */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-3",
            isDirty ? "pb-24" : "pb-8",
          )}
        >
          <Button type="submit" loading={saving || isSubmitting} disabled={!isDirty}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
          {isDirty ? (
            <p className="text-small text-ink/50">You have unsaved changes.</p>
          ) : null}
          {isEdit ? (
            <Link
              href="/admin/products"
              className="ml-auto text-small font-medium text-ink/50 transition-colors hover:text-ink"
            >
              Back to the catalogue
            </Link>
          ) : null}
        </div>
      </form>

      {isDirty ? (
        <UnsavedChangesBar
          onSave={() => void handleSubmit(onSubmit)()}
          onDiscard={discard}
          saving={saving || isSubmitting}
        />
      ) : null}
    </div>
  );
}
