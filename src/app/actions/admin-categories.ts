"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import {
  categorySlugIsTaken,
  getCategoryForEdit,
} from "@/lib/data/admin-categories";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema, type CategoryInput } from "@/lib/validations/product";

/*
  Category actions.

  Same shape as every other admin action: ADMIN check, Zod validation, a
  try/catch that returns { success, error, fieldErrors }, and a
  revalidatePath so the storefront and the desk agree.
 */

type Result = {
  success: boolean;
  error: string;
  fieldErrors: Record<string, string[]>;
};

const FAILED = (error: string): Result => ({
  success: false,
  error,
  fieldErrors: {},
});

async function requireAdmin(): Promise<string | null> {
  const session = await auth();

  if (!session?.user) return "Sign in to make that change.";
  if (session.user.role !== "ADMIN") return "Only an admin can change the shelves.";

  return null;
}

/** Creates a category. The slug comes from the name when not supplied. */
export async function createCategoryAction(
  input: unknown,
): Promise<Result & { categoryId?: string }> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = categorySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data: CategoryInput = parsed.data;

  try {
    const slug = data.slug || slugify(data.name);

    if (await categorySlugIsTaken(slug)) {
      return {
        success: false,
        error: "That slug is already taken.",
        fieldErrors: { slug: ["Another shelf already uses that URL."] },
      };
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        sortOrder: data.sortOrder,
      },
      select: { id: true },
    });

    revalidatePath("/admin/categories", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {}, categoryId: category.id };
  } catch {
    return FAILED("We could not save that shelf. Try again in a moment.");
  }
}

/** Updates a category, re-checking the slug against every other category. */
export async function updateCategoryAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = categorySchema
    .extend({ id: z.string().cuid() })
    .safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;

  try {
    const existing = await getCategoryForEdit(data.id);

    if (!existing) {
      return FAILED("That shelf is no longer on the books.");
    }

    const slug = data.slug || slugify(data.name);

    if (await categorySlugIsTaken(slug, data.id)) {
      return {
        success: false,
        error: "That slug is already taken.",
        fieldErrors: { slug: ["Another shelf already uses that URL."] },
      };
    }

    await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        sortOrder: data.sortOrder,
      },
    });

    revalidatePath("/admin/categories", "page");
    revalidatePath("/shop", "layout");
    revalidatePath(`/shop?category=${slug}`, "page");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not save that shelf. Try again in a moment.");
  }
}

/**
 * Deletes a category — unless it still has products.
 *
 * A category with products cannot be deleted: the products would be left
 * pointing at nothing, and the shop would show a shelf that is not there. The
 * error says how many products are in it, so the admin knows what to move
 * first.
 */
export async function deleteCategoryAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = z
    .object({ categoryId: z.string().cuid() })
    .safeParse(input);

  if (!parsed.success) {
    return FAILED("That shelf could not be read.");
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true, name: true, _count: { select: { products: true } } },
    });

    if (!category) {
      return FAILED("That shelf is no longer on the books.");
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `“${category.name}” still has ${category._count.products} ${
          category._count.products === 1 ? "product" : "products"
        } in it. Move them to another shelf first.`,
        fieldErrors: {},
      };
    }

    await prisma.category.delete({ where: { id: category.id } });

    revalidatePath("/admin/categories", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not delete that shelf. Try again in a moment.");
  }
}
