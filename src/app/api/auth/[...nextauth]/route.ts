import { handlers } from "@/auth";

/*
  The Auth.js route handler.

  `/api/auth/*` is what the credentials provider posts to when it signs in from a
  client component. Everything else in the app reads the session with `auth()`
  rather than hitting this route, so this file is a mount point and nothing more.
*/
export const { GET, POST } = handlers;
