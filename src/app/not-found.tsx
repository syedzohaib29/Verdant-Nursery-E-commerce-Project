import Link from "next/link";

import { DroopingPlant } from "@/components/brand/drooping-plant";
import { LeafMark } from "@/components/layout/leaf-mark";
import { Button } from "@/components/ui/button";

/**
 * The branded 404.
 *
 * Two landmarks exist because the root layout no longer draws one: every route
 * group supplies its own `<main id="content">`, and this page sits below all of
 * them, so it brings its own. Without it a mistyped address would land on a page
 * with no main landmark at all — a small regression the moment the auth pages
 * took their own chrome.
 */
export default function NotFound() {
  return (
    <main
      id="content"
      className="flex flex-1 items-center bg-warm-white"
    >
      <div className="container-x py-20">
        <div className="mx-auto max-w-md text-center">
          <p className="flex items-center justify-center gap-2 text-forest">
            <LeafMark className="size-6" />
            <span className="eyebrow">Lost in the greenhouse</span>
          </p>

          <DroopingPlant className="mx-auto mt-8 size-28 text-forest" />

          <h1 className="mt-6 text-h2 text-ink">
            This page is in the compost.
          </h1>

          <p className="mt-4 text-pretty text-body text-ink/70">
            Whatever grew here has been repotted somewhere else — the link is
            old, or a typo moved it. The good news: the shop is one click away,
            and it has never once 404&apos;d.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button nativeButton={false} render={<Link href="/shop" />}>
              Browse the shop
            </Button>

            <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
              Back to the home page
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}