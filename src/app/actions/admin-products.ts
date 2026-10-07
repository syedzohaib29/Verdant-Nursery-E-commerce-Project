"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import {
  getProductImages,
  productHasOrders,
  slugIsTaken,
} from "@/lib/data/admin-products";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { productSchema } from "@/lib/validations/product";
import {
  imageAltSchema,
  imageOrderSchema,
  slugCheckSchema,
} from "@/lib/validations/admin";

/*
  Product actions.

  Every action follows the same shape: who is asking (an ADMIN, checked here and
  again by the layout), is the input real (Zod), and does it work — returning
  { success, error, fieldErrors } so the caller can report it without guessing.

  Money arrives in dollars and is converted to cents here, at the boundary. The
  client never sends cents, so a tampered request cannot invent a price the form
  did not ask for.
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

/** The ADMIN check every action in this file starts with. */
async function requireAdmin(): Promise<string | null> {
  const session = await auth();

  if (!session?.user) return "Sign in to make that change.";
  if (session.user.role !== "ADMIN") return "Only an admin can change the catalogue.";

  return null;
}

/** Dollars to cents, rounded so a long decimal cannot produce a fraction of a cent. */
function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Creates a product.
 *
 * The slug is generated from the name when the caller does not supply one, and
 * uniqueness is checked against the database — a slug that is already taken is a
 * URL that would 404 on the shop, which is a worse failure than a form error.
 */
export async function createProductAction(
  input: unknown,
): Promise<Result & { productId?: string }> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = productSchema.safeParse(input);

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
    const slug = data.slug || slugify(data.name);

    if (await slugIsTaken(slug)) {
      return {
        success: false,
        error: "That slug is already taken.",
        fieldErrors: { slug: ["Another product already uses that URL."] },
      };
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        priceCents: toCents(data.priceDollars),
        salePriceCents:
          data.salePriceDollars != null ? toCents(data.salePriceDollars) : null,
        stock: data.stock,
        sku: data.sku,
        categoryId: data.categoryId,
        featured: data.featured,
        light: data.light,
        water: data.water,
        petSafe: data.petSafe,
        difficulty: data.difficulty,
        heightCm: data.heightCm ?? null,
        careNotes: data.careNotes,
        isActive: data.isActive,
      },
      select: { id: true },
    });

    revalidatePath("/admin/products", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {}, productId: product.id };
  } catch {
    return FAILED("We could not save that product. Try again in a moment.");
  }
}

/**
 * Updates a product.
 *
 * The slug is re-checked for uniqueness against every *other* product, so a
 * product can keep its own slug but cannot take one that belongs to somebody
 * else. A missing product is a 404-shaped failure, not a silent no-op.
 */
export async function updateProductAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = productSchema
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
    const existing = await prisma.product.findUnique({
      where: { id: data.id },
      select: { id: true },
    });

    if (!existing) {
      return FAILED("That product is no longer on the books.");
    }

    const slug = data.slug || slugify(data.name);

    if (await slugIsTaken(slug, data.id)) {
      return {
        success: false,
        error: "That slug is already taken.",
        fieldErrors: { slug: ["Another product already uses that URL."] },
      };
    }

    await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        priceCents: toCents(data.priceDollars),
        salePriceCents:
          data.salePriceDollars != null ? toCents(data.salePriceDollars) : null,
        stock: data.stock,
        sku: data.sku,
        categoryId: data.categoryId,
        featured: data.featured,
        light: data.light,
        water: data.water,
        petSafe: data.petSafe,
        difficulty: data.difficulty,
        heightCm: data.heightCm ?? null,
        careNotes: data.careNotes,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/products", "page");
    revalidatePath(`/admin/products/${data.id}`, "page");
    revalidatePath("/shop", "layout");
    revalidatePath(`/shop/${slug}`, "page");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not save that product. Try again in a moment.");
  }
}

/**
 * Deletes a product — or retires it, if it has orders.
 *
 * An order line snapshots the name, price and image, so a product with history
 * can be taken off the shelf without breaking the orders that mention it. A
 * product with no orders is deleted outright: there is nothing to keep honest,
 * and a hard delete keeps the table from filling with ghosts.
 */
export async function deleteProductAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = z
    .object({ productId: z.string().cuid() })
    .safeParse(input);

  if (!parsed.success) {
    return FAILED("That product could not be read.");
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return FAILED("That product is no longer on the books.");
    }

    if (await productHasOrders(product.id)) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });

      revalidatePath("/admin/products", "page");
      revalidatePath("/shop", "layout");
      revalidatePath("/", "page");

      return {
        success: true,
        error: "",
        fieldErrors: {},
      };
    }

    await prisma.product.delete({ where: { id: product.id } });

    revalidatePath("/admin/products", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not delete that product. Try again in a moment.");
  }
}

/** Takes a product on or off the shelf without opening the edit form. */
export async function toggleProductActiveAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = z
    .object({ productId: z.string().cuid() })
    .safeParse(input);

  if (!parsed.success) {
    return FAILED("That product could not be read.");
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      return FAILED("That product is no longer on the books.");
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: !product.isActive },
    });

    revalidatePath("/admin/products", "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not change that product. Try again in a moment.");
  }
}

/**
 * Checks whether a slug is available, for the edit form's live feedback.
 *
 * A server action rather than a client-side check because the answer lives in
 * the database. The product being edited is excluded, so saving an unchanged
 * slug is not a collision with itself.
 */
export async function checkSlugAction(
  input: unknown,
): Promise<{ available: boolean; error: string }> {
  const denied = await requireAdmin();
  if (denied) return { available: false, error: denied };

  const parsed = slugCheckSchema.safeParse(input);

  if (!parsed.success) {
    return { available: false, error: "That slug is not valid." };
  }

  const taken = await slugIsTaken(parsed.data.slug, parsed.data.productId);

  return { available: !taken, error: taken ? "That slug is taken." : "" };
}

/**
 * Reorders a product's images.
 *
 * The new order arrives as the full list of ids, so the client cannot send a
 * partial order that would silently drop an image. Positions are rewritten from
 * the array index, which makes "the first image" unambiguous — the one the cards
 * and the cart line use.
 */
export async function reorderProductImagesAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = imageOrderSchema.safeParse(input);

  if (!parsed.success) {
    return FAILED("Those images could not be read.");
  }

  const { productId, imageIds } = parsed.data;

  try {
    const images = await getProductImages(productId);

    if (images.length === 0) {
      return FAILED("That product is no longer on the books.");
    }

    // The submitted list must be exactly the product's images — no more, no
    // fewer. A list that adds or drops an id is a bug or a tampered request,
    // and either way the database should not be rewritten from it.
    const current = new Set(images.map((image) => image.id));
    const submitted = new Set(imageIds);

    if (
      submitted.size !== imageIds.length ||
      imageIds.some((id) => !current.has(id))
    ) {
      return FAILED("The image list has changed. Reload and try again.");
    }

    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.productImage.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    revalidatePath(`/admin/products/${productId}`, "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not reorder those images. Try again in a moment.");
  }
}

/** Rewrites one image's alt text. */
export async function updateImageAltAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = imageAltSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the alt text and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: parsed.data.imageId },
      select: { id: true },
    });

    if (!image) {
      return FAILED("That image is no longer on the books.");
    }

    await prisma.productImage.update({
      where: { id: parsed.data.imageId },
      data: { alt: parsed.data.alt },
    });

    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not save that alt text. Try again in a moment.");
  }
}

/**
 * Deletes an image's database row.
 *
 * The file itself is removed by the upload route handler's DELETE method, which
 * owns the filesystem. This action only removes the row — the two are separate
 * because the file can be gone while the row remains (a failed upload, a manual
 * cleanup), and the row can be gone while the file remains (a delete that never
 * reached the disk).
 */
export async function deleteProductImageAction(
  input: unknown,
): Promise<Result> {
  const denied = await requireAdmin();
  if (denied) return FAILED(denied);

  const parsed = z
    .object({ imageId: z.string().cuid() })
    .safeParse(input);

  if (!parsed.success) {
    return FAILED("That image could not be read.");
  }

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: parsed.data.imageId },
      select: { id: true, productId: true },
    });

    if (!image) {
      return FAILED("That image is no longer on the books.");
    }

    await prisma.productImage.delete({ where: { id: image.id } });

    revalidatePath(`/admin/products/${image.productId}`, "page");
    revalidatePath("/shop", "layout");
    revalidatePath("/", "page");

    return { success: true, error: "", fieldErrors: {} };
  } catch {
    return FAILED("We could not delete that image. Try again in a moment.");
  }
}


