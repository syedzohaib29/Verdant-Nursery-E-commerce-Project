/**
 * The hero's picture column.
 *
 * A plain wrapper carrying the CSS entrance, which — unlike a Motion `motion.div`
 * — is applied during the initial HTML paint so the LCP photograph never has to
 * wait for React hydration to become visible. `children` (the `<Image>`s) still
 * render on the server, so the figure is in the first response rather than
 * arriving with hydration.
 *
 * It enters later than the headline and travels further: the type is the thing
 * you read, the photograph is the thing that has not arrived yet, and
 * staggering them in that order is what makes the page feel composed rather
 * than loaded. `prefers-reduced-motion: reduce` flattens all entrance
 * animations to instant.
 */
export function HeroFigure({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative lg:col-span-5 lg:col-start-8"
      style={{ animation: "hero-rise 0.6s var(--ease-verdant) 0s both" }}
    >
      {children}
    </div>
  );
}
