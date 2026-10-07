import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";

import "./globals.css";

import { AppSession } from "@/components/auth/app-session";
import { Toaster } from "@/components/ui/sonner";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SOCIALS,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    siteName: SITE_NAME,
    url: SITE_URL,
    type: "website",
    locale: "en_US",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — a small nursery in Portland`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

/** The business, in schema.org's words, for rich results. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: SITE_DESCRIPTION,
  email: "hello@verdant.dev",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Bench 4, Kiln Lane",
    addressLocality: "Portland",
    addressRegion: "OR",
    postalCode: "97209",
    addressCountry: "US",
  },
  sameAs: SITE_SOCIALS.map((social) => social.url),
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
      className={`${bricolage.variable} ${geist.variable}`}
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

        {/* The business as structured data, so a rich result knows what this
            site is before it has read a word of it. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

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
