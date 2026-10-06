import Link from "next/link";

import { LeafMark } from "@/components/layout/leaf-mark";

/**
 * The frame around `/login` and `/register`.
 *
 * Two columns on a large screen and one on a small one, which is the whole point
 * of putting this in a layout rather than repeating it in both pages: the panel,
 * the brand line and the split behave identically for sign-in and sign-up, so one
 * of them cannot drift.
 *
 * The site chrome does not appear here. The navbar and the footer live in
 * `(store)/layout.tsx`, and a parent layout cannot decline to render what it
 * owns — which is why sign-in is a route group with its own frame instead of a
 * section inside the storefront's. What replaces the navbar on a phone is the
 * compact brand line below: a logo that goes home and a way back to the shop,
 * and nothing else competing with the form.
 *
 * The photograph is a CSS background rather than an `<img>`, deliberately. The
 * panel is `hidden` below `lg`, and a background inside a `display:none` subtree
 * is never fetched — an eager `<img>` there would cost a phone a download for
 * something it can never paint. It also means the frame cannot shift while the
 * image arrives, because the box is sized by the panel.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Desktop: forest green, a tall photo, a small logo and one line of copy.
          Stacked so the photo takes whatever height is left over — the panel has
          to survive a laptop with a short window without clipping the type. */}
      <aside className="relative hidden shrink-0 overflow-hidden bg-forest p-10 lg:flex lg:w-[46%] lg:flex-col xl:p-12">
        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-2.5 text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-forest focus-visible:outline-none"
        >
          <LeafMark className="size-7" strokeWidth={1.75} />
          <span className="font-heading text-[1.0625rem] font-semibold tracking-[-0.015em]">
            Verdant
          </span>
        </Link>

        <div
          aria-hidden="true"
          className="relative z-10 mt-10 min-h-0 flex-1 overflow-hidden rounded-xl bg-forest/70 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.7)]"
          style={{
            backgroundImage: "url(/images/calathea-orbifolia-1.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
          }}
        />

        {/* A short line in the heading face, set against the panel rather than
            over the photo so it stays legible at any window height. */}
        <p className="relative z-10 mt-10 max-w-[15ch] font-heading text-[clamp(1.75rem,1.4vw+1.25rem,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-white">
          Come in. Mind the monstera.
        </p>
      </aside>

      {/* The form column. On a phone this is the whole page, so it carries the
          compact brand line; on a desktop the logo in the panel does that job and
          the line stands down rather than doubling up. */}
      <div className="flex min-h-0 flex-1 flex-col bg-warm-white">
        <header className="border-b border-ink/10 lg:hidden">
          <div className="container-x flex min-h-14 items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-ink focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <LeafMark className="size-5 text-forest" strokeWidth={1.75} />
              <span className="font-heading text-[0.9375rem] font-semibold tracking-[-0.015em]">
                Verdant
              </span>
            </Link>

            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center text-small font-medium text-forest underline-offset-[6px] hover:underline focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Back to the shop
            </Link>
          </div>
        </header>

        <main id="content" className="flex flex-1 items-center py-12 sm:py-16">
          <div className="container-x w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
