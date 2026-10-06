"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

/**
 * The product gallery.
 *
 * Two layouts off one piece of state, because a phone and a desktop disagree about
 * what the primary gesture is. On a phone it is a thumb, so the photographs are a
 * snap carousel with dots: swipe is the thing people already know. From 1024px it
 * is a pointer, so the photographs become a single stage with a thumbnail column
 * and a hover zoom.
 *
 * The zoom is a background layer at 210% tracking the cursor, not a scaled `<img>`.
 * Scaling the image itself softens it at 2x and slides it out from under the
 * pointer, and a `transform-origin` that follows the mouse jumps on every move.
 * A background-position moves nothing and blurs nothing.
 */
export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);

  if (images.length === 0) return <GalleryFallback name={name} />;

  /**
   * Keeps the dots honest while a thumb is doing the swiping.
   *
   * A dot that only moves when a dot is tapped is worse than no dots: the visitor
   * swipes, the dot stays where it was, and the indicator now contradicts the
   * picture. Snapping means the settled position is always a whole multiple of the
   * slide width, so the nearest index is a division rather than a search.
   */
  function trackSwipe() {
    const element = scroller.current;
    if (!element) return;

    const index = Math.round(element.scrollLeft / element.clientWidth);
    setActive((current) => (index === current ? current : index));
  }

  /**
   * Tapping a dot has to move the carousel as well as the indicator, otherwise the
   * dot is a control that changes one pixel of a page it does not scroll.
   */
  function slideTo(index: number) {
    const element = scroller.current;
    if (!element) return;

    setActive(index);
    element.scrollTo({ left: index * element.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-4">
      {images.length > 1 ? (
        <Thumbnails
          images={images}
          active={active}
          onSelect={setActive}
          name={name}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        {/* Pointer layout: one stage, crossfading between photographs. */}
        <div className="group/zoom relative hidden aspect-[4/5] overflow-hidden rounded-2xl bg-mint lg:block">
          <AnimatePresence initial={false}>
            <motion.div
              key={images[active]?.id ?? active}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-0"
            >
              <StageImage image={images[active]} name={name} />
            </motion.div>
          </AnimatePresence>

          <ZoomLayer image={images[active]} name={name} />
        </div>

        {/* Thumb layout: a snap scroller. The dots are real buttons, so the second
            photograph is reachable without swiping — a carousel that can only be
            advanced by a gesture is a carousel some people can never advance. */}
        <div className="lg:hidden">
          <div
            ref={scroller}
            onScroll={trackSwipe}
            className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 [scrollbar-width:none]"
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-mint"
              >
                <StageImage image={image} name={name} priority={index === 0} />
              </div>
            ))}
          </div>

          {images.length > 1 ? (
            <CarouselDots
              count={images.length}
              active={active}
              onSelect={slideTo}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StageImage({
  image,
  name,
  priority = false,
}: {
  image: GalleryImage | undefined;
  name: string;
  priority?: boolean;
}) {
  if (!image) return <GalleryFallback name={name} />;

  return (
    <Image
      src={image.url}
      alt={image.alt || `${name}, photographed on the nursery bench`}
      fill
      priority={priority}
      sizes="(min-width: 1024px) 44vw, 100vw"
      className="object-cover"
    />
  );
}

/**
 * The zoom, as a layer above the photograph.
 *
 * `backgroundPosition` is driven straight from the pointer with no transition, so
 * the crop follows the cursor; only the fade in is animated, and only on the way
 * in, so the picture is not shimmering while the mouse moves over it.
 */
function ZoomLayer({ image, name }: { image: GalleryImage | undefined; name: string }) {
  if (!image) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "zoom-layer pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-verdant",
        "group-hover/zoom:opacity-100",
      )}
      style={{ backgroundImage: `url(${image.url})` }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;

        // 0..100 maps the pointer across the 210% background, so the pixel under
        // the cursor stays under the cursor.
        event.currentTarget.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
      }}
    >
      <span className="sr-only">{name} zoomed</span>
    </div>
  );
}

function Thumbnails({
  images,
  active,
  onSelect,
  name,
}: {
  images: GalleryImage[];
  active: number;
  onSelect: (index: number) => void;
  name: string;
}) {
  return (
    <ul className="hidden shrink-0 flex-col gap-3 lg:flex">
      {images.map((image, index) => (
        <li key={image.id}>
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Show photograph ${index + 1} of ${images.length} of ${name}`}
            aria-current={index === active}
            className={cn(
              "relative block aspect-[4/5] w-20 overflow-hidden rounded-lg bg-mint transition-[box-shadow,opacity] duration-200 ease-verdant",
              index === active
                ? "shadow-[inset_0_0_0_2px_var(--color-forest)]"
                : "opacity-65 hover:opacity-100",
            )}
          >
            <Image
              src={image.url}
              alt=""
              aria-hidden="true"
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CarouselDots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    // The dots are 10px of ink. The buttons are 44px of target, because a dot is
    // exactly the thing a thumb is bad at and a finger is good at.
    <div className="mt-2 flex items-center justify-center">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Go to photograph ${index + 1} of ${count}`}
          aria-current={index === active}
          className="flex size-11 items-center justify-center"
        >
          <span
            className={cn(
              "h-2.5 rounded-full transition-[width,background-color] duration-300 ease-verdant",
              index === active ? "w-7 bg-forest" : "w-2.5 bg-ink/20 hover:bg-ink/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function GalleryFallback({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={`No photograph of ${name} yet`}
      className="grid aspect-[4/5] place-items-center rounded-2xl bg-mint text-center text-forest/45"
    >
      <span className="max-w-[16ch] text-small">
        We have not photographed this one yet.
      </span>
    </div>
  );
}
