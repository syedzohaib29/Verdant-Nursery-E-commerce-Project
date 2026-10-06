"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "cn";

const EASE = [0.22, 1, 0.36, 1] as const;

export type FooterLink = {
  href: string;
  label: string;
};

/**
 * One footer column.
 *
 * Desktop shows a plain list. Below the desktop breakpoint the same list becomes
 * a disclosure: the title is a 44px row, the chevron rotates, and the panel
 * animates its own height so nothing jumps. The list is written once and handed
 * to both presentations rather than duplicated as markup.
 */
export function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const list = (
    <ul className="pb-6 lg:pb-0">
      {links.map((link) => (
        <li key={link.href + link.label}>
          <Link
            href={link.href}
            className="inline-flex min-h-11 items-center text-[0.9375rem] text-ink/85 underline-offset-4 transition-colors duration-200 hover:text-forest hover:underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="border-b border-ink/10 last:border-b-0 lg:border-b-0">
      <h3 className="eyebrow">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 w-full items-center justify-between py-4 text-left lg:hidden"
        >
          {title}
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "size-5 text-ink transition-transform duration-300 ease-verdant",
              open && "rotate-180",
            )}
          />
        </button>
        <span className="hidden lg:block">{title}</span>
      </h3>

      <div id={panelId} className="hidden lg:block">
        {list}
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { height: "auto", opacity: 1, transition: { duration: 0.32, ease: EASE } }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { height: 0, opacity: 0, transition: { duration: 0.24, ease: EASE } }
            }
            className="overflow-hidden lg:hidden"
          >
            {list}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
