import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LeafMark } from "@/components/layout/leaf-mark";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * The frame around the back office.
 *
 * Two checks, for the same reason the account area repeats its guard: the proxy
 * bounces guests before the request is rendered, and this one bounces anything
 * that is not an ADMIN when the render actually happens. A STAFF member asking
 * to see the desk is sent to their shop account, not told they are special.
 * Indexing is off — the back office has no business being in a search engine.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/admin"))}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  return (
    <div className="min-h-[70vh] bg-warm-white">
      <div className="border-b border-ink/10 bg-white">
        <div className="container-x flex h-14 items-center gap-2.5">
          <LeafMark className="size-5 text-forest" />
          <span className="font-heading text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            Verdant back office
          </span>
          <span className="ml-auto text-small text-text-muted">
            {session.user.name}
          </span>
        </div>
      </div>

      <div className="container-x py-10 lg:py-14">{children}</div>
    </div>
  );
}