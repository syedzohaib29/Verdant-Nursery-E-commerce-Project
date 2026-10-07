import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = "Verdant — a small nursery in Portland";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The fallback card when a page does not draw its own.
 *
 * Drawn with satori rather than a static file so the palette and the type stay
 * exactly the brand's. Text only on purpose: satori cannot fetch our images at
 * request time, and a card that never fails is worth more than one that
 * sometimes shows a picture.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F8F8F4",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#0B0F0C",
            fontSize: 40,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: "#14532D",
            }}
          />
          {SITE_NAME}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              color: "#14532D",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div style={{ color: "#0B0F0C", opacity: 0.72, fontSize: 30 }}>
            Houseplants that overwintered on our own shelf.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}