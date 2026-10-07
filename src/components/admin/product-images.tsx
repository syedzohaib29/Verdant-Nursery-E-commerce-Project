"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GripVerticalIcon,
  ImagePlusIcon,
  Loader2Icon,
  StarIcon,
  TrashIcon,
} from "lucide-react";

import { deleteProductImageAction, reorderProductImagesAction, updateImageAltAction } from "@/app/actions/admin-products";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export type ProductImage = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

/**
 * The product's photograph gallery, managed as a list.
 *
 * Every image operation goes through the server: uploads land in
 * /public/uploads via the route handler, reordering and alt text are actions,
 * and deletes remove both the row and the file. This component owns only the
 * local order while a drag is in flight — the moment a drag ends, the new
 * order is sent and the server's answer becomes the truth again.
 *
 * Drag-to-reorder is the pointer-friendly path; the up and down buttons are
 * the keyboard-friendly one, and both write the same action so the two can
 * never disagree about what the order is.
 */
export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [order, setOrder] = useState<ProductImage[]>(images);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // The server is the source of truth; a refresh (after an upload, say) can
  // arrive while a drag is not in flight, and when it does the local order
  // steps aside.
  const [serverOrder, setServerOrder] = useState<ProductImage[]>(images);
  const dirty = JSON.stringify(order) !== JSON.stringify(serverOrder);

  function commit(next: ProductImage[]) {
    setOrder(next);
    setServerOrder(next);
  }

  /* ------------------------------ upload ------------------------------ */

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];

        // The same validation the route handler enforces, checked here so a
        // bad file is refused before it crosses the network.
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 4 * 1024 * 1024
        ) {
          toast.error(file.name, {
            description: "Only JPEG, PNG or WebP under 4MB.",
          });
          continue;
        }

        const form = new FormData();
        form.append("file", file);

        const response = await fetch(
          `/api/admin/products/${productId}/images`,
          { method: "POST", body: form },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          toast.error(file.name, {
            description: body?.error ?? "The upload failed.",
          });
          continue;
        }

        setProgress(Math.round(((index + 1) / files.length) * 100));
      }

      router.refresh();
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  /* ----------------------------- reordering ---------------------------- */

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
    void persistOrder(next);
  }

  function handleDrop(targetIndex: number) {
    if (!draggingId) return;

    const from = order.findIndex((image) => image.id === draggingId);
    if (from === -1 || from === targetIndex) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);

    commit(next);
    setDraggingId(null);
    setDragOverId(null);
    void persistOrder(next);
  }

  async function persistOrder(next: ProductImage[]) {
    const result = await reorderProductImagesAction({
      productId,
      imageIds: next.map((image) => image.id),
    });

    if (!result.success) {
      // The server refused the order — a concurrent edit, a deleted image.
      // The refresh brings back the truth.
      toast.error("We could not save that order.", {
        description: "Reloading the gallery.",
      });
      router.refresh();
    }
  }

  /* ------------------------------ alt text ----------------------------- */

  function startAltEdit(image: ProductImage) {
    setEditingAltId(image.id);
    setAltDraft(image.alt);
  }

  async function saveAlt(image: ProductImage) {
    const result = await updateImageAltAction({
      imageId: image.id,
      alt: altDraft,
    });

    if (result.success) {
      toast.success("Alt text saved.");
      setEditingAltId(null);
      router.refresh();
    } else {
      toast.error("We could not save that alt text.");
    }
  }

  /* ------------------------------ delete ------------------------------- */

  async function deleteImage(image: ProductImage) {
    const result = await deleteProductImageAction({ imageId: image.id });

    if (result.success) {
      toast.success("Image deleted.");
      router.refresh();
    } else {
      toast.error(result.error || "We could not delete that image.");
    }
  }

  /* ------------------------------- render ------------------------------ */

  return (
    <div>
      {/* The drop zone: a clear target that is also a file picker. */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          void uploadFiles(event.dataTransfer.files);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/25 bg-warm-white px-6 py-8 text-center transition-colors duration-200",
          uploading ? "pointer-events-none opacity-60" : "hover:border-forest/50",
        )}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => void uploadFiles(event.target.files)}
        />

        {uploading ? (
          <>
            <Loader2Icon
              aria-hidden="true"
              className="size-6 animate-spin text-forest"
            />
            <p className="text-small font-medium text-ink">
              Uploading… {progress}%
            </p>
            <div
              className="h-1.5 w-48 overflow-hidden rounded-full bg-ink/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-forest transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <ImagePlusIcon
              aria-hidden="true"
              className="size-6 text-forest"
              strokeWidth={1.75}
            />
            <p className="text-small font-medium text-ink">
              Drop photographs here, or
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInput.current?.click()}
            >
              Choose files
            </Button>
            <p className="text-xs text-ink/45">
              JPEG, PNG or WebP, up to 4MB each. The first image is the one the
              cards use.
            </p>
          </>
        )}
      </div>

      {/* The gallery itself. */}
      {order.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {order.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={(event) => {
                setDraggingId(image.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverId(image.id);
              }}
              onDragLeave={() => {
                setDragOverId((current) =>
                  current === image.id ? null : current,
                );
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(index);
              }}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-white transition-[box-shadow,opacity] duration-200",
                draggingId === image.id && "opacity-40",
                dragOverId === image.id &&
                  draggingId !== image.id &&
                  "shadow-[inset_0_0_0_2px_var(--color-forest)]",
                "border-ink/10",
              )}
            >
              <div className="relative aspect-[4/5] bg-mint">
                <Image
                  src={image.url}
                  alt={image.alt || "Product photograph"}
                  fill
                  sizes="(min-width: 1024px) 12vw, 25vw"
                  className="object-cover"
                />

                {index === 0 ? (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-forest px-2 py-1 text-[0.6875rem] leading-none font-semibold text-white">
                    <StarIcon aria-hidden="true" className="size-3" />
                    Primary
                  </span>
                ) : null}
              </div>

              {/* The drag handle: visible, labelled, and the pointer's cue. */}
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-white/90 text-ink/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <GripVerticalIcon className="size-4" />
              </span>

              {/* Alt text: shown when editing, summarized when not. */}
              {editingAltId === image.id ? (
                <div className="p-2">
                  <label htmlFor={`alt-${image.id}`} className="sr-only">
                    Alt text for image {index + 1}
                  </label>
                  <textarea
                    id={`alt-${image.id}`}
                    value={altDraft}
                    onChange={(event) => setAltDraft(event.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full rounded-md border border-ink/15 bg-white p-2 text-xs text-ink outline-none focus-visible:border-forest"
                  />
                  <div className="mt-1.5 flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => void saveAlt(image)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setEditingAltId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 p-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-ink/55">
                    {image.alt || "No alt text yet"}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit alt text for image ${index + 1}`}
                    onClick={() => startAltEdit(image)}
                    className="min-h-8 min-w-8"
                  >
                    <span className="text-xs">Alt</span>
                  </Button>
                </div>
              )}

              {/* Move up/down: the keyboard-friendly reorder. */}
              <div className="flex items-center justify-between border-t border-ink/10 px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move image ${index + 1} up`}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="min-h-8 min-w-8"
                >
                  <ArrowUpIcon className="size-4" />
                </Button>
                <span className="text-xs text-ink/40 tabular-nums">
                  {index + 1} / {order.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move image ${index + 1} down`}
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  className="min-h-8 min-w-8"
                >
                  <ArrowDownIcon className="size-4" />
                </Button>
              </div>

              <div className="absolute right-2 bottom-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete image ${index + 1}`}
                  onClick={() => void deleteImage(image)}
                  className="min-h-8 min-w-8 bg-white/90 text-destructive hover:bg-destructive/10"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {dirty ? (
        <p className="mt-3 text-xs text-ink/45">Saving the new order…</p>
      ) : null}
    </div>
  );
}
