import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/*
  The gate.

  Called before a request is rendered, on every path listed in the matcher below.
  It reads the session cookie and hands the decision to `callbacks.authorized` in
  `@/auth.config` — this file exists only to mount that decision and to say which
  routes it applies to.

  Two naming notes, because both look wrong at first:

  - Next 16 renamed the `middleware.ts` file convention to `proxy.ts`. The old
    name still works but is deprecated, and this is the same thing under its
    current name.
  - It is `NextAuth(authConfig).auth` and not `auth` from `@/auth`. The full
    config pulls in the Credentials provider, which pulls in the data layer, which
    pulls in Prisma's SQLite driver — code that cannot run on the Edge runtime.
    Importing `@/auth.config` alone is what keeps this file Edge-safe, and it is
    why the split exists.

  The matcher is deliberately narrow. A gate that runs on `/_next/static` is a
  gate that can accidentally block the CSS, and a gate that runs on `/` is a gate
  that makes the home page dynamic for everybody.
*/
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
