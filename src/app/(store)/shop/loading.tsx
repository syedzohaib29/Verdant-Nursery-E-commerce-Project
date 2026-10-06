import { ProductGridSkeleton } from "@/components/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { SHOP_PER_PAGE } from "@/lib/shop-query";

/**
 * Shop, loading.
 *
 * The sidebar is drawn at its real 15rem width and the grid uses the real column
 * counts, so the transition into the loaded page moves nothing. The only thing
 * missing is the toolbar, because a fake result count would be a number we have
 * not asked the database for yet.
 */
export default function ShopLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading plants</span>

      <section className="bg-warm-white pt-10 pb-10 lg:pt-14 lg:pb-12">
        <div className="container-x">
          <Skeleton className="h-12 w-72 rounded-lg sm:h-14" />
          <Skeleton className="mt-5 h-5 w-full max-w-xl rounded-full" />
          <Skeleton className="mt-2.5 h-5 w-4/5 max-w-md rounded-full" />
        </div>
      </section>

      <section className="bg-white py-8 lg:py-12">
        <div className="container-x">
          <div className="grid gap-x-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <div className="flex flex-col gap-7">
                <Skeleton className="h-3.5 w-16 rounded-full" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-4 border-b border-ink/10 pb-4">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="ml-auto h-11 w-32 rounded-lg" />
              </div>

              <ProductGridSkeleton count={SHOP_PER_PAGE} className="mt-8" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
