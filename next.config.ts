import type { NextConfig } from "next";

/**
 * A Content Security Policy that keeps the site locked down without breaking
 * what it actually runs.
 *
 * Next inlines its bootstrapping scripts and Motion writes inline styles, so
 * `'unsafe-inline'` has to stay for both — a nonce-carrying build is a bigger
 * job than this site needs. Stripe's checkout runs its own script from its own
 * origin and talks back to its API, so those two hosts are let in for when card
 * payment is enabled. `unsafe-eval` is dev-only: Turbopack's hot reload
 * evaluates modules in place.
 */
function contentSecurityPolicy(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
    "https://js.stripe.com",
  ].join(" ");

  const connectSrc = [
    "'self'",
    "https://api.stripe.com",
    "https://js.stripe.com",
    // Dev-only: hot reload talks over a websocket on the same host.
    ...(process.env.NODE_ENV === "development" ? ["ws:"] : []),
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Nothing this shop does needs the camera, a microphone, geolocation or USB.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      // Turbopack does not read the "style" export condition, so the documented
      // `@import "shadcn/tailwind.css"` in globals.css cannot resolve on its own.
      "shadcn/tailwind.css": "shadcn/dist/tailwind.css",
    },
  },
};

export default nextConfig;