import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

import { safeCallbackUrl } from "@/lib/redirects";

/*
  The half of Auth.js that has to run anywhere.

  This module is imported by two callers with very different budgets: `src/auth.ts`,
  which runs in the Node runtime and may talk to the database, and `src/proxy.ts`,
  which is bundled for the Edge runtime, where `node:fs`, `node:net` and anything
  built on them simply do not exist. Prisma's SQLite driver is squarely in that
  category, so nothing in this file may import it — nor bcrypt, nor the data layer,
  nor anything else that assumes a file system.

  What is left is configuration that is true in both places: which page a
  signed-out visitor is sent to, that sessions are tokens rather than database
  rows, and the callbacks that decide who is allowed through and what the session
  ends up carrying.

  `src/auth.ts` spreads this config and adds the Credentials provider. The proxy
  uses it alone, so a credentials check never reaches the Edge bundle — which is
  the difference between an Edge runtime warning in the build output and no
  warning at all.
*/
export const authConfig = {
  // Empty here on purpose. The only provider this app has needs a database and a
  // password hash, and neither belongs in a bundle destined for the Edge runtime —
  // `src/auth.ts` spreads this config and replaces the list with the real one.
  // Leaving the field present (rather than omitted) is what keeps the shared
  // config type-complete on its own.
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },

  callbacks: {
    /**
     * The gate, called only by the proxy.
     *
     * It returns a response rather than a bare boolean whenever somebody is being
     * sent *elsewhere*, because the two redirects want different things: a guest
     * needs to be told where they were headed, and a customer who wandered into
     * `/admin` is already signed in and would otherwise be bounced to a sign-in
     * form that would bounce them straight back.
     *
     * The matcher in `src/proxy.ts` only lets protected paths in here, so this
     * callback never has to ask whether a route needs protecting — it only has to
     * ask who is asking.
     */
    authorized({ auth, request }) {
      const user = auth?.user;

      if (!user) {
        const returnTo = safeCallbackUrl(
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
        );

        return NextResponse.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(returnTo)}`, request.nextUrl),
        );
      }

      // `/admin` is ADMIN only. A staff account is not a lesser admin: it is a
      // different job, and the dashboard is not part of it.
      if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/account", request.nextUrl));
      }

      return true;
    },

    /**
     * Puts the id and the role on the token, once, on the sign-in round trip.
     *
     * `user` is undefined on every later request, which is the whole point: the
     * token is copied forward untouched and nothing is re-read from the database
     * to build it. See `src/auth.ts` for what that costs.
     */
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }

      return token;
    },

    /**
     * Reads the session back off the token. The `role` is narrowed here by the
     * fallback rather than trusted blind, so a token written by an older version
     * of this file still produces a role the rest of the app can type-check.
     */
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role ?? "CUSTOMER";

      return session;
    },
  },
} satisfies NextAuthConfig;
