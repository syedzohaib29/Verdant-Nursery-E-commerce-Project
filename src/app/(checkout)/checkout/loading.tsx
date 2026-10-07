/**
 * The checkout, while the page is still on its way.
 *
 * Mirrors the two-column shape of the checkout without copying its content — a
 * quiet placeholder so the first paint is not a layout jump.
 */
export default function CheckoutLoading() {
  return (
    <div className="container-x py-10 lg:py-14">
      <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
      <div className="mt-4 h-10 max-w-xl animate-pulse rounded-lg bg-ink/10" />

      <div className="mt-12 flex flex-col gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="order-last space-y-6 lg:order-1">
          {[0, 1, 2, 3].map((section) => (
            <div
              key={section}
              className="rounded-xl border border-ink/10 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 animate-pulse rounded-full bg-ink/10" />
                <div className="h-5 w-40 animate-pulse rounded bg-ink/10" />
              </div>
              <div className="mt-5 h-12 animate-pulse rounded-lg bg-ink/[0.06]" />
            </div>
          ))}
        </div>

        <div className="order-first lg:order-2">
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <div className="h-4 w-28 animate-pulse rounded bg-ink/10" />
            <div className="mt-4 space-y-3">
              <div className="h-16 animate-pulse rounded-lg bg-ink/[0.06]" />
              <div className="h-16 animate-pulse rounded-lg bg-ink/[0.06]" />
            </div>
            <div className="mt-5 h-6 animate-pulse rounded bg-ink/10" />
          </div>
        </div>
      </div>
    </div>
  );
}