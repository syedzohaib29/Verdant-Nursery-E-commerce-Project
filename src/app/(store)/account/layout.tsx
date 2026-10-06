import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountNav } from "@/components/account/account-nav";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Your account",
  description: "Orders, saved addresses and account details, all in one place.",
};

/**
 * The frame around every account page.
 *
 * The proxy already sends guests away from `/account`, and this guards again for
 * the same reason checks repeat everywhere in this codebase: the middleware sees
 * the outgoing request and this sees the incoming render, and either one being
 * wrong on its own would be enough to hand a stranger a customer's orders.
 *
 * The rail and the page content share a grid on a desktop; the mobile strip of
 * tabs lives up in `AccountNav`, which renders both views and lets CSS pick which
 * one participates in the grid.
 */
export default async function AccountLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  return (
    <section className="bg-warm-white">
      <div className="container-x py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-12">
          <AccountNav
            userName={session.user.name ?? "Your account"}
            userEmail={session.user.email ?? ""}
          />

          <div className="mt-6 min-w-0 lg:mt-0">{children}</div>
        </div>
      </div>
    </section>
  );
}