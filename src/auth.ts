import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { verifyCredentials } from "@/lib/data/users";
import { loginSchema } from "@/lib/validations/auth";

/*
  Authentication.

  Credentials only, against the bcrypt hashes in the User table. There is no
  database adapter and no Account/Session table: the JWT strategy means signing in
  writes one signed cookie and nothing else, which keeps the checkout path free of
  a second write per request.

  This file is deliberately thin. Everything that has to survive being bundled for
  the Edge runtime lives in `@/auth.config`, so `src/proxy.ts` can import that and
  leave this one — with Prisma and bcrypt inside it — behind. The provider below is
  the only thing here that could not go in the shared config, and it is only ever
  called from the Node runtime: a sign-in arrives as a server action or as a POST
  to `/api/auth/callback/credentials`, both of which are Node routes.

  Two deliberate choices:

  - `authorize` returns only the four fields the cookie needs. The session token
    is a cookie the browser holds, so anything put in it is readable by whoever
    has the browser. The user id and role are enough to authorise anything, and
    nothing sensitive belongs here.
  - The role is re-read from the token, not the database, on every request. That
    means demoting somebody does not take effect until their cookie expires. For
    an eight-hour session that is a fair trade for not a query per page render;
    the alternative would be a database round trip on every server component.
*/
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        // Validated here rather than trusted from the form: this is the one place
        // an unvalidated email reaches the database.
        const parsed = loginSchema.safeParse(raw);

        if (!parsed.success) return null;

        const user = await verifyCredentials(parsed.data.email, parsed.data.password);

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
