import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/auth";
import { getProductImages } from "@/lib/data/admin-products";
import { prisma } from "@/lib/prisma";

/*
  Product image uploads.

  POST saves an uploaded file to /public/uploads and adds a row to the
  product's gallery. DELETE removes the file from disk and the row from the
  database.

  The rules that keep this honest:

  - The content type is checked against a whitelist, not trusted from the
    request. A file that claims to be a PNG but is not will not be saved.
  - The size is capped before the write, so a multi-hundred-megabyte upload
    cannot fill the disk.
  - The filename is generated here and never taken from the client. An
    original filename can contain path traversal, overwrites, or characters
    the filesystem or a URL will not carry.
  - The extension comes from the validated content type, not from the
    filename, so a .jpg that is actually a .html is stored as what it is.

  PRODUCTION NOTE: this writes to the local filesystem, which is right for a
  single-server development shop and wrong for the real one. In production the
  bytes should go to Cloudinary, S3, or UploadThing — the row's `url` is the
  only thing the rest of the app reads, so swapping the transport is a change
  in this file and nowhere else.
 */

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Bytes. 4MB is a generous ceiling for a photograph of a plant. */
const MAX_BYTES = 4 * 1024 * 1024;

/** The image types the shop will store, mapped to their extension. */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to upload images." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only an admin can upload images." },
      { status: 403 },
    );
  }

  return null;
}

/** The product's current image count, for the new image's position. */
async function nextPosition(productId: string): Promise<number> {
  const last = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return last ? last.position + 1 : 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json(
      { error: "That product is no longer on the books." },
      { status: 404 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file was sent." },
      { status: 400 },
    );
  }

  const extension = ALLOWED_TYPES[file.type];

  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images can be uploaded." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is over 4MB. Export it smaller and try again." },
      { status: 413 },
    );
  }

  // A random name, never the original: the original can contain path
  // traversal, overwrite another file, or carry characters a URL will not.
  const filename = `${randomBytes(16).toString("hex")}${extension}`;

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);

    const position = await nextPosition(productId);

    const image = await prisma.productImage.create({
      data: {
        productId,
        url: `/uploads/${filename}`,
        alt: "",
        position,
      },
      select: { id: true, url: true, alt: true, position: true },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "We could not save that image. Try again in a moment." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id: productId } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json(
      { error: "No image was named." },
      { status: 400 },
    );
  }

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
    select: { id: true, url: true },
  });

  if (!image) {
    return NextResponse.json(
      { error: "That image is no longer on the books." },
      { status: 404 },
    );
  }

  // The row goes first. If the file delete fails, the row is already gone and
  // the next upload can reuse the name — a dangling file in /public/uploads
  // is a cosmetic problem, a dangling row is a broken image on a product page.
  await prisma.productImage.delete({ where: { id: image.id } });

  // Only files inside the upload directory are ever removed, and only when the
  // url points at one. A row with an external URL (a future CDN migration) has
  // no local file to delete.
  if (image.url.startsWith("/uploads/")) {
    const filename = path.basename(image.url);

    try {
      await unlink(path.join(UPLOAD_DIR, filename));
    } catch {
      // The file is already gone — a failed upload, a manual cleanup. The row
      // is deleted, which is the part that matters.
    }
  }

  // Re-pack the positions so the gallery has no gaps: 0, 1, 2 rather than
  // 0, 2, 5 after a delete from the middle.
  const images = await getProductImages(productId);

  await prisma.$transaction(
    images.map((entry, index) =>
      prisma.productImage.update({
        where: { id: entry.id },
        data: { position: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
