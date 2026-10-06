import { Skeleton } from "@/components/ui/skeleton";

/**
 * One plant, loading.
 *
 * The two columns are drawn at the proportions they will actually occupy — 7/12
 * gallery, 5/12 details — and both keep a fixed aspect ratio or a fixed line
 * count, so the moment the real product arrives nothing moves. A loading state
 * that guesses wrong is a second layout shift, one you chose to ship.
 *
 * Only one star is drawn in the rating row, because we cannot know how many
 * reviews exist yet, and a placeholder row of five would be a rating we invented.
 */
export default function ProductLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading plant</span>

      <section className="bg-warm-white pt-6 pb-10 lg:pt-8 lg:pb-14">
        <div className="container-x">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>

          <div className="mt-6 grid gap-x-10 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
            </div>

            <div className="lg:col-span-5 lg:pl-4">
              <Skeleton className="h-3 w-20 rounded-full" />

              <Skeleton className="mt-3 h-9 w-4/5 rounded-lg" />

              <div className="mt-4 flex items-center gap-3">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>

              <Skeleton className="mt-5 h-8 w-32 rounded-lg" />
              <Skeleton className="mt-2.5 h-4 w-24 rounded-full" />

              <div className="mt-5 space-y-2.5">
                <Skeleton className="h-5 w-full rounded-full" />
                <Skeleton className="h-5 w-full rounded-full" />
                <Skeleton className="h-5 w-2/3 rounded-full" />
              </div>

              <div className="mt-7 flex gap-3">
                <Skeleton className="h-12 w-32 rounded-lg" />
                <Skeleton className="h-12 flex-1 rounded-lg" />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-ink/10 py-5 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index}>
                    <Skeleton className="h-3 w-16 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}