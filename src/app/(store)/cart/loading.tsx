/**
 * Skeleton for the basket.
 *
 * The shapes here are the real ones. The heading block is the height of the
 * heading it replaces, the sidebar is the height of the summary card, and the
 * rows are 104px each — which is a 72px thumbnail plus the 32px of text and gap
 * beneath it. A skeleton at the wrong height is a layout shift the moment the real
 * content arrives, which is the exact thing this is supposed to prevent.
 */
export default function CartLoading() {
  return (
    <section className="bg-warm-white py-10 lg:py-14">
      <div className="container-x">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/10 pb-6">
          <div>
            <div className="h-3 w-24 rounded bg-ink/[0.07]" />
            <div className="mt-3 h-9 w-56 rounded bg-ink/[0.07]" />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="border-y border-ink/10">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="flex gap-4 border-b border-ink/10 py-5 last:border-b-0"
              >
                <div className="size-[4.5rem] shrink-0 rounded-md bg-ink/[0.07]" />
                <div className="flex-1">
                  <div className="h-4 w-3/5 rounded bg-ink/[0.07]" />
                  <div className="mt-4 h-11 w-40 rounded-md bg-ink/[0.07]" />
                </div>
                <div className="h-4 w-14 rounded bg-ink/[0.07]" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
            <div className="h-6 w-24 rounded bg-ink/[0.07]" />
            <div className="mt-5 h-5 w-full rounded bg-ink/[0.07]" />
            <div className="mt-2 h-1.5 w-full rounded-full bg-ink/[0.07]" />
            <div className="mt-6 h-11 w-full rounded-lg bg-ink/[0.07]" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full rounded bg-ink/[0.07]" />
              <div className="h-4 w-full rounded bg-ink/[0.07]" />
              <div className="h-4 w-full rounded bg-ink/[0.07]" />
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-5">
              <div className="h-4 w-16 rounded bg-ink/[0.07]" />
              <div className="h-8 w-24 rounded bg-ink/[0.07]" />
            </div>
            <div className="mt-6 h-12 w-full rounded-lg bg-ink/[0.07]" />
          </div>
        </div>
      </div>
    </section>
  );
}
