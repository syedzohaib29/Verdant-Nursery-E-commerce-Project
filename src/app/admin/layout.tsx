import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_NAV_COOKIE } from "@/lib/constants";
import { getAdminAlerts } from "@/lib/data/admin";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: {
    default: "Verdant back office",
    template: "%s · Verdant back office",
  },
  robots: { index: false, follow: false },
};

/**
 * The frame around the back office.
 *
 * Two checks, for the same reason the account area repeats its guard: the proxy
 * bounces anyone without a session before the request is rendered, and this one
 * bounces anything that is not an ADMIN when the render actually happens. A
 * STAFF member asking to see the desk is sent to their shop account, not told
 * they are nearly trusted. Indexing is off — the back office has no business
 * being in a search engine.
 *
 * The rail's collapsed state is read here, from the cookie, so the shell mounts
 * already knowing its own width: a sidebar that starts wide and snaps shut is a
 * flash of layout on every single page.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/admin"))}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const [store, alerts] = await Promise.all([
    cookies(),
    getAdminAlerts(),
  ]);

  const defaultCollapsed =
    store.get(ADMIN_NAV_COOKIE)?.value === "collapsed";

  return (
    <AdminShell
      user={{
        name: session.user.name ?? "Back office",
        email: session.user.email ?? "",
      }}
      alerts={alerts}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </AdminShell>
  );
}
