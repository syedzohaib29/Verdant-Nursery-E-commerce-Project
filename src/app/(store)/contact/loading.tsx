import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div className="bg-warm-white">
      <div className="container-x pt-10 pb-10 lg:pt-14 lg:pb-12">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-12 w-full max-w-2xl lg:h-16" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      </div>

      <div className="container-x pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="mt-4 h-5 w-5/6" />
            <Skeleton className="mt-4 h-11 w-full" />
            <Skeleton className="mt-4 h-11 w-full" />
            <Skeleton className="mt-4 h-11 w-full" />
            <Skeleton className="mt-4 h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-2xl bg-white" />
            <Skeleton className="aspect-[16/10] w-full rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}