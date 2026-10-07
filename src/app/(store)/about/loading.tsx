import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="bg-warm-white">
      <div className="container-x pt-10 pb-12 lg:pt-14 lg:pb-16">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-12 w-full max-w-3xl lg:h-16" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        <Skeleton className="mt-2 h-5 w-2/3 max-w-lg" />
      </div>

      <div className="bg-white py-14 lg:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-3/4" />
            <Skeleton className="mt-5 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-5/6" />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-mint" />
          </div>
        </div>
      </div>
    </div>
  );
}