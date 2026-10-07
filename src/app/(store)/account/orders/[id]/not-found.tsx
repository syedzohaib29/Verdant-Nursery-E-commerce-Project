import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * When an order number is not this customer's, the detail page calls `notFound`
 * and this renders inside the account frame — so a wrong number shows a clear
 * dead end instead of somebody else's order, and instead of a bare 404.
 */
export default function OrderNotFound() {
  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-small font-medium text-ink/70 outline-none transition-colors duration-200 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
        All orders
      </Link>

      <div className="mt-10 rounded-xl border border-dashed border-ink/20 bg-white/60 p-8 text-center">
        <p className="font-heading text-lg font-semibold text-ink">
          We cannot find that order.
        </p>
        <p className="mx-auto mt-2 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink/60">
          It may belong to another account, or the number may be wrong. Your
          orders are all listed on the page behind the button above.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/account/orders" />}
          className="mt-5"
        >
          Back to your orders
        </Button>
      </div>
    </div>
  );
}