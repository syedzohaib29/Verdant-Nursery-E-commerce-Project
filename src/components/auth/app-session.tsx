"use client";

import { SessionProvider } from "next-auth/react";

import { WishlistSync } from "@/components/auth/wishlist-sync";

/**
 * The session, and everything that depends on it.
 *
 * One client island in the root layout rather than a `SessionProvider` with
 * scattered consumers, because the wishlist has to be reconciled with the account
 * exactly once per page load and not once per component that happens to care.
 * `WishlistSync` renders nothing and lives inside the provider so it can read the
 * session.
 *
 * A provider rather than a server read, deliberately: it fetches the session from
 * the client after mount, which means the three static routes stay static. Reading
 * the session in the layout would opt every page into dynamic rendering to answer
 * a question that only one icon button needs.
 */
export function AppSession({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <WishlistSync />
    </SessionProvider>
  );
}
