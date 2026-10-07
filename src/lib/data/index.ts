/*
  Data layer barrel.

  Every module in this folder is `server-only` and must be called from a Server
  Component, a server action or a route handler. Importing from "@/lib/data"
  in a Client Component fails the build on purpose: shipping a database query to
  the browser is exactly the mistake this boundary exists to prevent.
*/

export * from "@/lib/data/admin";
export * from "@/lib/data/categories";
export * from "@/lib/data/journal";
export * from "@/lib/data/orders";
export * from "@/lib/data/products";
export * from "@/lib/data/reviews";
export * from "@/lib/data/settings";
export * from "@/lib/data/users";
