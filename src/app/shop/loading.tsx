import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <main className="flex-1" aria-busy="true" aria-live="polite">
      <section className="bg-warm-white px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="mt-6 h-12 w-full max-w-2xl rounded-lg" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl rounded-full" />
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:px-8 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="border-t border-ink/10 pt-4">
              <Skeleton className="h-5 w-3/4 rounded-full" />
              <Skeleton className="mt-2 h-4 w-1/2 rounded-full" />
              <Skeleton className="mt-4 h-4 w-full rounded-full" />
              <Skeleton className="mt-4 h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <p className="sr-only">Loading the greenhouse.</p>
    </main>
  );
}