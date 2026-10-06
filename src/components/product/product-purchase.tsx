"use client";

import { useRef } from "react";

import { AddToCartBar } from "@/components/product/add-to-cart-bar";
import { BuyBox } from "@/components/product/buy-box";
import type { CartItemInput } from "@/store/cart";

/**
 * The purchase area and its mobile echo.
 *
 * These two live together because they have to agree about one thing: where the
 * real add-to-cart button is. The bar needs a reference to it to know when it has
 * scrolled away, and that reference is a `ref`, which cannot be passed across the
 * server boundary. So the pair is one small client island.
 *
 * The whole basket line travels as one object rather than five props, because both
 * of these components need all five fields to do their job and passing them
 * separately is how a bar ends up showing a plant's name next to a different
 * plant's price.
 */
export function ProductPurchase({
  item,
}: {
  item: CartItemInput;
}) {
  const anchor = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={anchor}>
        <BuyBox item={item} />
      </div>

      <AddToCartBar item={item} triggerRef={anchor} enabled />
    </>
  );
}
