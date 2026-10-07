import type { CSSProperties, ReactNode } from "react";

/**
 * The hero entrance: the one bold load animation on the site.
 *
 * Each headline line sits inside a clipped box and slides up from below it,
 * so the type appears to be pulled out from behind a mask rather than simply
 * fading in. Everything else — eyebrow, paragraph, buttons — is a quiet fade
 * underneath it. One strong move and two supporting ones; a page where
 * everything animates has nothing left to emphasise.
 *
 * Implemented as pure CSS animations: the entrance must not wait for React
 * hydration, otherwise every paint on this page (including the LCP
 * photograph) is blocked on client work. The global reduced-motion override
 * in globals.css collapses all of it to instant.
 */
export function HeroEntrance({
  eyebrow,
  lines,
  children,
}: {
  eyebrow: string;
  /** Already-broken lines. The mask can only reveal what it is given. */
  lines: string[];
  children: ReactNode;
}) {
  const rise: (delay: number) => CSSProperties = (delay) => ({
    animation: `hero-rise 0.5s var(--ease-verdant) ${delay}s both`,
  });

  return (
    <>
      <p className="eyebrow" style={rise(0)} data-reveal="">
        {eyebrow}
      </p>

      <h1 className="mt-6 text-display text-ink">
        {lines.map((line, index) => (
          <span
            key={line}
            className="block overflow-hidden pb-[0.14em] -mb-[0.14em]"
          >
            <span
              className="block"
              style={{
                animation: `hero-line-rise 0.4s var(--ease-verdant) ${index * 0.05}s both`,
              }}
            >
              {line}
            </span>
          </span>
        ))}
      </h1>

      <div style={rise(0.12)} data-reveal="">
        {children}
      </div>
    </>
  );
}
