/**
 * The edit form's skeleton: same shape as the create skeleton, because it is
 * the same form — the page does not jump between the two.
 */
export default function EditProductLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-4 w-28 rounded bg-ink/[0.07]" />

      <div>
        <div className="h-3 w-16 rounded bg-ink/[0.07]" />
        <div className="mt-3 h-10 w-56 max-w-full rounded bg-ink/[0.07]" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-ink/[0.07]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <div className="hidden lg:block">
          <div className="flex flex-col gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-8 w-full rounded-lg bg-ink/[0.05]" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6"
            >
              <div className="h-6 w-24 rounded bg-ink/[0.07]" />
              <div className="mt-2 h-4 w-56 max-w-full rounded bg-ink/[0.06]" />
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="h-12 rounded-lg bg-ink/[0.07]" />
                <div className="h-12 rounded-lg bg-ink/[0.07]" />
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="h-12 rounded-lg bg-ink/[0.07]" />
                <div className="h-12 rounded-lg bg-ink/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
