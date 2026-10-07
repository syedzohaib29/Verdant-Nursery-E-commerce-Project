/**
 * The order list's skeleton: the heading, the shelf selector and five rows at
 * the height the table really uses, so the first page lands without moving
 * anything under it.
 */
export default function AdminOrdersLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div>
        <div className="h-3 w-16 rounded bg-ink/[0.07]" />
        <div className="mt-3 h-10 w-40 max-w-full rounded bg-ink/[0.07]" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-ink/[0.07]" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((chip) => (
          <div key={chip} className="h-11 w-24 rounded-full bg-ink/[0.07]" />
        ))}
      </div>

      <div className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4 border-b border-ink/10 pb-3">
          <div className="h-3 w-20 rounded bg-ink/[0.07]" />
          <div className="h-3 w-24 rounded bg-ink/[0.07]" />
          <div className="hidden h-3 w-20 rounded bg-ink/[0.07] sm:block" />
          <div className="ml-auto h-3 w-16 rounded bg-ink/[0.07]" />
          <div className="h-3 w-16 rounded bg-ink/[0.07]" />
        </div>

        <div className="flex flex-col divide-y divide-ink/[0.07]">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-4 py-4">
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-ink/[0.07]" />
                <div className="mt-2 h-3 w-44 max-w-full rounded bg-ink/[0.06]" />
              </div>
              <div className="hidden h-4 w-40 rounded bg-ink/[0.07] sm:block" />
              <div className="hidden h-4 w-24 rounded bg-ink/[0.07] md:block" />
              <div className="h-4 w-16 rounded bg-ink/[0.07]" />
              <div className="h-6 w-20 rounded-full bg-ink/[0.06]" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
          <div className="h-4 w-40 rounded bg-ink/[0.07]" />
          <div className="flex gap-2">
            <div className="size-11 rounded-lg bg-ink/[0.07]" />
            <div className="size-11 rounded-lg bg-ink/[0.07]" />
            <div className="size-11 rounded-lg bg-ink/[0.07]" />
          </div>
        </div>
      </div>
    </div>
  );
}
