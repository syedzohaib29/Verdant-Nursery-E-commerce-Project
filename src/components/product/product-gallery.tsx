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
  /**
   * The zoom crop, kept in a ref rather than state.
   *
   * It changes on every pixel of mouse movement, and this is a Server Component's
   * client island holding two `<Image>` elements and an AnimatePresence; re-rendering
   * all of that several times a second to move a background is exactly the kind of
   * work a pointer move should never cause. A ref write plus a direct style poke on
   * the layer costs nothing and never touches React.
   */
  const zoomLayer = useRef<HTMLDivElement>(null);
  const zoom = useRef("50% 50%");

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

  /**
   * Moves the magnified crop to wherever the pointer is.
   *
   * `x * 100` is the entire mapping, and it is worth being precise about why,
   * because the arithmetic is not what it looks like. A percentage
   * `background-position` is measured against the layer's *overflow*, not against
   * the box: at `background-size: 210%` the layer is 1.1x the stage, so it travels
   * from -110% to 0% and `100%` is what pins its right edge to the pointer at the
   * far right. The pointer's own travel and the layer's travel are both measured
   * from the same left edge and both scale with the box, so the two cancel and no
   * correction term is needed.
   *
   * Touch is excluded because a drag is a swipe on this page, and hijacking it to
   * pan a magnified crop would break the carousel gesture.
   */
  function trackZoom(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    const position = `${x * 100}% ${y * 100}%`;

    // Poked directly as well as recorded, so the first move paints the right crop
    // instead of waiting for a re-render that no state change asks for.
    if (zoomLayer.current) zoomLayer.current.style.backgroundPosition = position;
    zoom.current = position;
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
        {/* Pointer layout: one stage, crossfading between photographs.

            The pointer handler is on this box rather than on the zoom layer below
            it, because the layer is `pointer-events-none` and a pointerless element
            is never the target of a move. See `ZoomLayer`. */}
        <div
          className="group/zoom relative hidden aspect-[4/5] overflow-hidden rounded-2xl bg-mint lg:block"
          onPointerMove={trackZoom}
        >
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

          <ZoomLayer
            image={images[active]}
            name={name}
            position={{ backgroundPosition: zoom.current }}
            layerRef={zoomLayer}
          />
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
 *
 * The handler lives on the stage, not here, and that is the fix for the zoom
 * jumping into a corner. This layer is `pointer-events-none` — it has to be, or it
 * would swallow the clicks on the buy box below — and an element with no pointer
 * events is never the *target* of a `pointermove`; it only ever sees one that
 * bubbled up from a descendant, and it has none. So the handler attached here ran
 * for nothing, `backgroundPosition` stayed at the CSS default of `0% 0%`, and
 * hovering parked the visitor in the top-left corner of the 210% layer with no way
 * out: the picture looked broken rather than zoomed. Listening on the parent means
 * the event has a real target every time.
 *
 * `x * 100` is what makes the pixel under the cursor stay under the cursor. A
 * percentage background-position is measured against the *overflow*, not the box:
 * at 210% the layer is 2.1x the stage, so it can travel from -110% to 0% and
 * `100%` pins the far edge exactly where the pointer is. The arithmetic is in
 * `product-gallery.tsx`'s call site because that is where the pointer lands.
 */
function ZoomLayer({
  image,
  name,
  position,
  layerRef,
}: {
  image: GalleryImage | undefined;
  name: string;
  /** CSS `background-position`, written by the stage's pointer handler. */
  position: React.CSSProperties;
  layerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!image) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={cn(
        "zoom-layer pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-verdant",
        "group-hover/zoom:opacity-100",
      )}
      style={{ backgroundImage: `url(${image.url})`, ...position }}
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
