import { Skeleton } from "@/components/ui/skeleton";

/**
 * The journal index, in its skeleton form: the hero rules in first, then the
 * masonry grid settling behind it. Images carry their own mint wash so the
 * outline of the page is legible before a pixel of it has loaded.
 */
export default function JournalLoading() {
  return (
    <div className="bg-warm-white">
      <div className="container-x pt-8 pb-10 lg:pt-12 lg:pb-14">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-12 w-3/4 max-w-xl lg:h-16" />
        <Skeleton className="mt-4 h-5 w-full max-w-md" />
        <Skeleton className="mt-2 h-5 w-2/3 max-w-sm" />
      </div>

      <div className="pb-20">
        <div className="container-x space-y-14">
          <div>
            <Skeleton className="h-[30vw] w-full rounded-2xl lg:h-[26rem]" />
            <Skeleton className="mt-6 h-6 w-2/3 max-w-md" />
            <Skeleton className="mt-3 h-4 w-full max-w-lg" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <Skeleton
                  className={`w-full rounded-xl bg-mint ${index % 3 === 0 ? "aspect-[16/10]" : index % 3 === 1 ? "aspect-[3/4]" : "aspect-[1/1]"}`}
                />
                <Skeleton className="mt-4 h-3 w-1/3" />
                <Skeleton className="mt-2 h-5 w-4/5" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1.5 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}