import Link from "next/link";

import { LeafMark } from "@/components/layout/leaf-mark";

/**
 * The 404.
 *
 * Two landmarks exist because the root layout no longer draws one: every route
 * group supplies its own `<main id="content">`, and this page sits below all of
 * them, so it brings its own. Without it a mistyped address would land on a page
 * with no main landmark at all — a small regression the moment the auth pages
 * took their own chrome.
 */
export default function NotFound() {
  return (
    <main id="content" className="flex flex-1 items-center bg-warm-white">
      <div className="container-x py-20">
        <div className="mx-auto max-w-md">
          <p className="flex items-center gap-2 text-forest">
            <LeafMark className="size-6" />
            <span className="eyebrow">Page not found</span>
          </p>

          <h1 className="mt-4 text-h2 text-ink">
            Nothing is growing at this address.
          </h1>

          <p className="mt-4 text-body text-ink/70">
            The link may be old, or a typo may have crept in. The shop is where
            everything we actually have is listed.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-6 text-small font-medium text-white transition-colors hover:bg-forest/90 focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Back to the home page
            </Link>

            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-6 text-small font-medium text-ink transition-colors hover:border-forest hover:text-forest focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Browse the shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
