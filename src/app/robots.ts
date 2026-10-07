import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * What crawlers may and may not read.
 *
 * The back office, the checkout, account pages and the auth screens hold
 * somebody's order history or the desk itself, so they are closed to indexing
 * twice — here, and in each route's own `robots` metadata — because relying on
 * either alone is how a private page ends up public.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}