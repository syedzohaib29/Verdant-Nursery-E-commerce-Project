"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";

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
      <SessionRefresher />
      <WishlistSync />
    </SessionProvider>
  );
}

/**
 * Re-reads the session after each navigation.
 *
 * Sign-in is a server action that throws a redirect, and Next completes that as a
 * *client-side* navigation. The root layout — and with it this provider — is not
 * unmounted, so it keeps the session it fetched before the sign-in and every
 * `useSession()` consumer renders the signed-out state. A refresh fixed it,
 * because a hard load rebuilds the provider, which is exactly the wrong reason for
 * a login to appear to work.
 *
 * `update()` after a pathname change reads the new cookie from the same client, so
 * one small request per navigation settles the account menu, the wishlist and
 * anything else reading the session. The first render is skipped: the provider has
 * already fetched on mount, and a second call there would only duplicate it.
 */
function SessionRefresher() {
  const pathname = usePathname();
  const { update } = useSession();
  const mounted = useRef(false);

  /**
   * `update` in a ref, and deliberately *not* in the dependency list.
   *
   * `update()` puts the fetched session into provider state, which re-renders
   * every consumer — including this one. If `update`'s identity also changes with
   * that render, the effect re-fires, fetches again, re-renders again, and the
   * provider ends up in a loop that refetches `/api/auth/session` continuously.
   * That loop was real: sign-out stopped working entirely, because the page never
   * went idle long enough to complete the click. Depending on the path alone means
   * one refetch per navigation and none per render, which is the intent.
   */
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    void updateRef.current();
  }, [pathname]);

  return null;
}
