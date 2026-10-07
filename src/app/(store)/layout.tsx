import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/**
 * The storefront chrome.
 *
 * The navbar, the footer and the basket drawer live here rather than in the root
 * layout because `/login` and `/register` deliberately do not want them: those two
 * pages are a single focused column with their own small brand mark, and a parent
 * layout has no way to stop rendering something it owns. Splitting on the route
 * group is the only honest way to give two sets of pages two sets of chrome.
 *
 * Every route that shows the shop — the home page, `/shop`, `/cart`, `/wishlist`,
 * `/care` and the design check — sits inside this group, so the split is invisible
 * from the outside: the URLs did not move, only the file that draws the frame did.
 *
 * It is a server component and reads nothing from the session, which is what keeps
 * `/` and `/care` statically prerenderable.
 */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />

      <main id="content" className="flex-1">
        {children}
      </main>

      <Footer />

      {/* The basket, mounted once and controlled from the store so that adding
          from anywhere — a card on the home page, the buy box on a product page,
          the mobile bar — opens the same panel. */}
      <CartDrawer />
    </>
  );
}
