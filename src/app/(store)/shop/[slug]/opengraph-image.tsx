import { ImageResponse } from "next/og";

import { getProductBySlug } from "@/lib/data/products";
import { SITE_NAME } from "@/lib/site";

export const alt = "Verdant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

/**
 * The share card for one plant.
 *
 * Text and colour only, drawn with satori: fetching a product photograph at
 * request time would make the card depend on the image host, and a card that
 * always renders is worth more than one that sometimes shows a picture.
 */
export default async function ProductOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const name = product?.name ?? "A plant, currently off the bench";
  const price = product ? (product.effectivePriceCents / 100).toFixed(2) : null;
  const category = product?.categoryName ?? "Verdant plant shop";

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

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div
            style={{
              color: "#14532D",
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              maxWidth: 980,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              color: "#0B0F0C",
              fontSize: 34,
            }}
          >
            <span
              style={{
                borderRadius: 999,
                backgroundColor: "#E6F2E8",
                color: "#14532D",
                padding: "8px 22px",
              }}
            >
              {category}
            </span>
            {price ? (
              <span style={{ fontWeight: 600 }}>${price}</span>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}