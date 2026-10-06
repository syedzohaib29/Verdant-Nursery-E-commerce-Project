"use client";

import { useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

export type TabPanel = {
  id: string;
  label: string;
  content: React.ReactNode;
};

/**
 * Tabs, on one line, with an indicator that slides.
 *
 * The indicator is one element shared between the active buttons by id, so Motion
 * measures its real box on the old tab and the new one and tweens between them.
 * That is why it lives *inside* the button rather than being positioned from the
 * parent: a bar positioned with a measured `left` is wrong the moment the font
 * swaps or the window narrows, and a bar that is simply "at the bottom of
 * whichever tab is active" cannot be.
 *
 * The panels are stacked in one grid cell and every one of them stays mounted.
 * See the comment on the grid for why that matters.
 *
 * Keyboard is the APG pattern: one tab stop for the whole strip, arrows to move
 * between tabs, Home and End for the ends.
 */
export function ProductTabs({ panels }: { panels: TabPanel[] }) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const list = useRef<HTMLDivElement>(null);
  const baseId = useId();

  function focusTab(index: number) {
    const next = ((index % panels.length) + panels.length) % panels.length;

    setActive(next);

    const tabs = list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[next]?.focus();
  }

  return (
    <div>
      <div
        ref={list}
        role="tablist"
        aria-label="Product information"
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowRight":
              event.preventDefault();
              focusTab(active + 1);
              break;
            case "ArrowLeft":
              event.preventDefault();
              focusTab(active - 1);
              break;
            case "Home":
              event.preventDefault();
              focusTab(0);
              break;
            case "End":
              event.preventDefault();
              focusTab(panels.length - 1);
              break;
            default:
              break;
          }
        }}
        className="-mx-5 flex gap-1 overflow-x-auto border-b border-ink/10 px-5 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {panels.map((panel, index) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${panel.id}`}
            aria-controls={`${baseId}-panel-${panel.id}`}
            aria-selected={index === active}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            className={cn(
              "relative min-h-11 shrink-0 px-3 text-[0.9375rem] whitespace-nowrap transition-colors duration-200",
              index === active
                ? "font-medium text-ink"
                : "text-text-muted hover:text-ink",
            )}
          >
            {panel.label}

            {index === active ? (
              <motion.span
                aria-hidden="true"
                layoutId="verdant-tab-indicator"
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE }
                }
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-forest"
              />
            ) : null}
          </button>
        ))}
      </div>

      {/* Every panel stays mounted, in the same grid cell, and the inactive ones
          are made `invisible`. That is what holds the height steady: an unmounted
          panel contributes nothing to the row, so the container would be exactly
          as tall as whichever tab you happened to open, and every switch would
          shove the related-products section up or down by however much the two
          panels differed. Mounting them all makes the row as tall as the tallest
          panel from the first paint, so nothing below ever moves.

          `visibility: hidden` rather than `display: none` is load-bearing twice
          over — it holds the grid cell, and it takes the panel out of the tab
          order and the accessibility tree without needing `aria-hidden`. */}
      <div className="grid pt-8">
        {panels.map((panel, index) => {
          const open = index === active;

          return (
            <motion.div
              key={panel.id}
              role="tabpanel"
              id={`${baseId}-panel-${panel.id}`}
              aria-labelledby={`${baseId}-tab-${panel.id}`}
              initial={false}
              animate={
                reduceMotion
                  ? { opacity: open ? 1 : 0 }
                  : { opacity: open ? 1 : 0, y: open ? 0 : 8 }
              }
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE }
              }
              className={cn(
                "[grid-area:1/1] min-w-0",
                open ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              {panel.content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
