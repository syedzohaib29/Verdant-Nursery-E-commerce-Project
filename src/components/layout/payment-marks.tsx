import { cn } from "cn";

/*
  Payment marks.

  Drawn as inline SVG rather than shipped as image files: they are small, they
  inherit the forest ink, and they stay crisp on any display. Each chip is sized
  to its wordmark instead of being forced into a square, which is how card
  networks are usually presented in a footer anyway.
*/
const NETWORKS = ["Visa", "Mastercard", "Amex", "PayPal"] as const;

const CHIP_HEIGHT = 26;
const PADDING = 9;
const GLYPH_WIDTH = 5.9;

export function PaymentMarks({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Accepted payment methods"
      className={cn("flex items-center gap-2", className)}
    >
      {NETWORKS.map((network) => {
        const width = Math.round(PADDING * 2 + network.length * GLYPH_WIDTH);

        return (
          <li key={network}>
            <svg
              viewBox={`0 0 ${width} ${CHIP_HEIGHT}`}
              width={width}
              height={CHIP_HEIGHT}
              role="img"
              aria-label={network}
              className="text-forest"
            >
              <rect
                x="0.5"
                y="0.5"
                width={width - 1}
                height={CHIP_HEIGHT - 1}
                rx="5"
                className="fill-white stroke-ink/15"
              />
              <text
                x={width / 2}
                y={CHIP_HEIGHT / 2 + 3.2}
                textAnchor="middle"
                className="fill-current font-sans text-[9px] font-medium tracking-[0.06em] uppercase"
              >
                {network}
              </text>
            </svg>
          </li>
        );
      })}
    </ul>
  );
}
