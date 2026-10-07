/*
  Site-wide facts: the canonical origin, the business name and the one-line
  description every metadata block falls back to. One file so the sitemap, the
  robots rule, the structured data and every Open Graph card cannot disagree
  about what the site is called or where it lives.
*/

export const SITE_NAME = "Verdant";

export const SITE_TAGLINE = "Plants with good manners";

export const SITE_DESCRIPTION =
  "A small nursery in Portland. Houseplants that overwintered on our own shelf, arrive in soil that drains, and come with the light they expect named on the card.";

/** Trailing slashes stripped, so `${SITE_URL}/path` is always exactly right. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://verdant.dev"
).replace(/\/+$/, "");

export const SITE_SOCIALS = [
  { label: "Instagram", url: "https://instagram.com/verdant" },
  { label: "Pinterest", url: "https://pinterest.com/verdant" },
  { label: "X", url: "https://x.com/verdant" },
] as const;