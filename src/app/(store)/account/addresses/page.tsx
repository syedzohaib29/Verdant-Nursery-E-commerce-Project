import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserWithAddresses } from "@/lib/data/users";
import { AddressesManager } from "@/components/account/addresses-manager";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Addresses",
};

/**
 * The address book page — mostly a shell. The list and every mutation live in
 * the client manager below the heading, because adding, editing and removing
 * are the whole job of the page and all three are interactive.
 */
export default async function AccountAddressesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  const user = await getUserWithAddresses(session.user.id);

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  return (
    <div>
      <p className="eyebrow">Addresses</p>
      <h1 className="mt-3 text-h2 text-ink">Your book.</h1>
      <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink/60">
        Addresses you have saved. The default one is pre-picked at checkout, and
        the first one saved always becomes the default.
      </p>

      <div className="mt-8">
        <AddressesManager initial={user.addresses} />
      </div>
    </div>
  );
}