import { Skeleton } from "@/components/ui/skeleton";

/**
 * One post, loading: a cover, then prose shaped like the article it precedes.
 * The paragraph bars shrink as they descend, which is roughly how text ends up
 * shorter than the measure — and costs nothing to look at.
 */
export default function JournalPostLoading() {
  return (
    <div className="bg-warm-white">
      <div className="container-x pt-10 pb-8 lg:pt-14 lg:pb-10">
        <div className="mx-auto max-w-[42rem]">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-4 h-4 w-56" />
          <Skeleton className="mt-6 h-12 w-full lg:h-16" />
          <Skeleton className="mt-4 h-6 w-5/6" />
          <Skeleton className="mt-2 h-6 w-2/3" />
        </div>
      </div>

      <div className="container-x">
        <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-mint" />
      </div>

      <div className="py-12 lg:py-16">
        <div className="container-x">
          <div className="mx-auto max-w-[42rem] space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}