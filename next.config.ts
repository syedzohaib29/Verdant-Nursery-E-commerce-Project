import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // Turbopack does not read the "style" export condition, so the documented
      // `@import "shadcn/tailwind.css"` in globals.css cannot resolve on its own.
      "shadcn/tailwind.css": "shadcn/dist/tailwind.css",
    },
  },
};

export default nextConfig;
