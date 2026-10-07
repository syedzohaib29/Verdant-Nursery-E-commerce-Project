/**
 * The overview's skeleton — the real thing at half light.
 *
 * Every block below is the height of the block it stands in for: the four KPI
 * cards are the card's own padding and figure size, the chart reserves the
 * exact 260/320px the graph will occupy, and the lists keep their row rhythm.
 * A skeleton at the wrong size is a layout shift the moment the data lands,
 * which is precisely the jump this file exists to prevent.
 */
export default function AdminOverviewLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div>
        <div className="h-3 w-24 rounded bg-ink/[0.07]" />
        <div className="mt-3 h-10 w-72 max-w-full rounded bg-ink/[0.07]" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-ink/[0.07]" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-xl border border-ink/10 bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-ink/[0.07]" />
            <div className="mt-3 h-9 w-32 rounded bg-ink/[0.07]" />
            <div className="mt-4 h-6 w-40 rounded-full bg-ink/[0.05]" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="h-6 w-24 rounded bg-ink/[0.07]" />
            <div className="mt-2 h-4 w-80 max-w-full rounded bg-ink/[0.07]" />
          </div>
          <div className="flex gap-2">
            <div className="h-11 w-24 rounded-lg bg-ink/[0.07]" />
            <div className="h-11 w-24 rounded-lg bg-ink/[0.07]" />
            <div className="h-11 w-24 rounded-lg bg-ink/[0.07]" />
          </div>
        </div>

        <div className="mt-5 flex h-[260px] flex-col justify-between py-6 sm:h-[320px]">
          <div className="h-1.5 w-full rounded-full bg-ink/[0.06]" />
          <div className="h-1.5 w-full rounded-full bg-ink/[0.06]" />
          <div className="h-1.5 w-full rounded-full bg-ink/[0.06]" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <div className="h-6 w-40 rounded bg-ink/[0.07]" />
          <div className="mt-2 h-4 w-64 max-w-full rounded bg-ink/[0.07]" />
          <div className="mt-5 flex flex-col gap-5">
            <div className="mx-auto size-[190px] rounded-full border-[34px] border-ink/[0.05]" />
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-ink/[0.08]" />
                <div className="h-4 w-24 rounded bg-ink/[0.07]" />
                <div className="h-px flex-1 bg-ink/[0.08]" />
                <div className="h-4 w-8 rounded bg-ink/[0.07]" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
          <div className="h-6 w-32 rounded bg-ink/[0.07]" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-ink/[0.07]" />
          <div className="mt-5 flex flex-col gap-4">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-9 shrink-0 rounded-md bg-ink/[0.07]" />
                  <div className="h-4 flex-1 rounded bg-ink/[0.07]" />
                  <div className="h-4 w-14 rounded bg-ink/[0.07]" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-ink/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="h-6 w-36 rounded bg-ink/[0.07]" />
            <div className="mt-2 h-4 w-80 max-w-full rounded bg-ink/[0.07]" />
          </div>
          <div className="h-4 w-24 rounded bg-ink/[0.07]" />
        </div>
        <div className="mt-6 flex flex-col divide-y divide-ink/[0.07]">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center gap-4 py-3.5">
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-ink/[0.07]" />
                <div className="mt-2 h-3 w-48 max-w-full rounded bg-ink/[0.06]" />
              </div>
              <div className="hidden h-4 w-24 rounded bg-ink/[0.07] sm:block" />
              <div className="h-4 w-16 rounded bg-ink/[0.07]" />
              <div className="h-6 w-20 rounded-full bg-ink/[0.06]" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="h-3 w-20 rounded bg-ink/[0.07]" />
        <div className="mt-3 h-6 w-40 rounded bg-ink/[0.07]" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-ink/[0.07]" />
        <div className="mt-4 flex flex-col divide-y divide-ink/[0.07]">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 py-3.5">
              <div className="size-10 shrink-0 rounded-md bg-ink/[0.07]" />
              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-ink/[0.07]" />
                <div className="mt-2 h-3 w-28 rounded bg-ink/[0.06]" />
              </div>
              <div className="h-9 w-24 rounded-lg bg-ink/[0.07]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
