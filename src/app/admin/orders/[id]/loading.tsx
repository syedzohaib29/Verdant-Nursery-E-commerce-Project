/**
 * The order's skeleton: back link, the number at its real size, the items card
 * with four lines, and the four side cards — the page's own shape, waiting for
 * the query.
 */
export default function AdminOrderDetailLoading() {
  return (
    <div aria-hidden="true">
      <div className="h-4 w-28 rounded bg-ink/[0.07]" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <div className="h-3 w-16 rounded bg-ink/[0.07]" />
          <div className="mt-3 h-12 w-56 max-w-full rounded bg-ink/[0.07]" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-ink/[0.07]" />
        </div>
        <div className="h-8 w-24 rounded-full bg-ink/[0.07]" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
        <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <div className="h-5 w-36 rounded bg-ink/[0.07]" />
          <div className="mt-5 flex flex-col divide-y divide-ink/[0.07]">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-4 py-4">
                <div className="size-14 shrink-0 rounded-lg bg-ink/[0.07] sm:size-16" />
                <div className="flex-1">
                  <div className="h-4 w-44 max-w-full rounded bg-ink/[0.07]" />
                  <div className="mt-2 h-3 w-24 rounded bg-ink/[0.06]" />
                </div>
                <div className="h-4 w-16 rounded bg-ink/[0.07]" />
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <div className="h-4 w-full rounded bg-ink/[0.06]" />
            <div className="h-4 w-full rounded bg-ink/[0.06]" />
            <div className="h-5 w-1/2 rounded bg-ink/[0.07]" />
          </div>
        </div>

        <div className="space-y-6">
          {[0, 1, 2, 3].map((card) => (
            <div
              key={card}
              className="rounded-xl border border-ink/10 bg-white p-5"
            >
              <div className="h-4 w-32 rounded bg-ink/[0.07]" />
              <div className="mt-4 space-y-2.5">
                <div className="h-4 w-3/4 rounded bg-ink/[0.07]" />
                <div className="h-3 w-1/2 rounded bg-ink/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
