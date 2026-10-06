import type { UserRole } from "@/lib/constants";
import type { DefaultSession } from "next-auth";

/*
  Session shape.

  Auth.js types the session user as `{ name?, email?, image? }` and leaves the
  door open for exactly this: a declaration merging `id` and `role` onto both
  `Session.user` and `User` means a server component can read `session.user.id`
  without a cast, and the provider's returned user object type-checks against the
  same fields.
*/
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  /**
   * The sign-in token, and the one claim added to it.
   *
   * `next-auth/jwt` re-exports this interface rather than declaring its own, so
   * this is where the merge has to happen: the callbacks Auth.js calls are typed
   * against `@auth/core/jwt`, and augmenting the re-exporting path instead would
   * quietly produce a *second*, unrelated `JWT` that the callbacks never see.
   */
  interface JWT {
    role?: UserRole;
  }
}

export {};
