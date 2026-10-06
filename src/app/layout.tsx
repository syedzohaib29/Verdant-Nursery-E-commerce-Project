import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";

import "./globals.css";

import { AppSession } from "@/components/auth/app-session";
import { Toaster } from "@/components/ui/sonner";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Verdant — Plants for people who forget to water",
    template: "%s | Verdant",
  },
  description:
    "A small, opinionated nursery. Houseplants that arrive healthy, soil that drains properly, and advice you can actually follow.",
};

export const viewport: Viewport = {
  // Single-theme light palette, declared so the browser chrome agrees with it.
  themeColor: "#F8F8F4",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Tells Next to switch smooth scrolling off while it restores scroll
      // position on navigation, so the jump to the top is instant and does not
      // read as a flicker behind the incoming page.
      data-scroll-behavior="smooth"
      className={`${bricolage.variable} ${inter.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        {/* Scroll reveals are driven by Motion, so without JavaScript their
            initial hidden state would never lift. This puts the content back. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        <a
          href="#content"
          className="sr-only rounded-lg focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 text-small font-medium text-forest shadow-lift"
        >
          Skip to content
        </a>

        {/* The whole tree, but not the chrome.

            This used to wrap a navbar, a `<main>` and a footer, and that is exactly
            what had to change: `/login` and `/register` need their own split
            layout with a small brand mark rather than the full site bar, and a
            parent layout cannot opt out of anything it renders. So the chrome moved
            down into `(store)`, where every storefront route shares it, and this
            level now owns only what has to be true everywhere — the session
            provider (the account control and the wishlist reconciliation both need
            it, including on the auth pages, which is where a merge is most likely
            to happen) and the toaster. */}
        <AppSession>{children}</AppSession>

        {/* The palette is light only, so the toaster is pinned to it rather than
            following an OS preference the site does not support.

            `offset` is a CSS length, so it reads the custom property that the
            product page's sticky add-to-cart bar publishes while it is on screen.
            Without this, a confirmation on a phone would land underneath the bar
            that caused it. */}
        <Toaster
          theme="light"
          position="bottom-center"
          closeButton
          richColors
          offset="var(--verdant-bottom-offset, 1.5rem)"
        />
      </body>
    </html>
  );
}
