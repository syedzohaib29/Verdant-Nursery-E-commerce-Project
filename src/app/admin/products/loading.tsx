/**
 * The catalogue's skeleton: the filter bar and five rows at the height the
 * table really uses, so the first page lands without moving anything.
 */
export default function AdminProductsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div>
        <div className="h-3 w-16 rounded bg-ink/[0.07]" />
        <div className="mt-3 h-10 w-40 max-w-full rounded bg-ink/[0.07]" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-ink/[0.07]" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="h-11 flex-1 rounded-lg bg-ink/[0.07] sm:max-w-xs" />
        <div className="h-11 w-36 rounded-lg bg-ink/[0.07]" />
        <div className="h-11 w-28 rounded-lg bg-ink/[0.07]" />
        <div className="h-11 w-32 rounded-lg bg-ink/[0.07]" />
        <div className="h-11 w-36 rounded-lg bg-ink/[0.07]" />
      </div>

      <div className="rounded-xl border border-ink/10 bg-white">
        <ul className="divide-y divide-ink/[0.07]">
          {[0, 1, 2, 3, 4].map((row) => (
            <li key={row} className="flex items-center gap-4 px-5 py-4">
              <div className="size-12 shrink-0 rounded-lg bg-ink/[0.07]" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 rounded bg-ink/[0.07]" />
                <div className="mt-2 h-3 w-24 rounded bg-ink/[0.06]" />
              </div>
              <div className="hidden h-4 w-16 rounded bg-ink/[0.07] sm:block" />
              <div className="hidden h-4 w-20 rounded bg-ink/[0.07] md:block" />
              <div className="h-6 w-10 rounded-full bg-ink/[0.07]" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
