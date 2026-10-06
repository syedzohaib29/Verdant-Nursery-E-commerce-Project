"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { shopHref, type ShopQuery } from "@/lib/shop-query";

/*
  The one place a filter change becomes a URL.

  The server hands the page the parsed query, so client and server can never
  disagree about what `?petSafe=false` means, and this hook only has to write.

  `router.replace` rather than `push`, wrapped in a transition: replacing keeps the
  history clean, so a visitor who sets three filters does not have to press Back
  three times to leave the shop, and the transition keeps the current results on
  screen while the new ones load instead of flashing an empty grid.
*/
export function useShopQuery(query: ShopQuery) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function goTo(next: ShopQuery) {
    startTransition(() => {
      router.replace(shopHref(next), { scroll: false });
    });
  }

  return { query, goTo, isPending };
}