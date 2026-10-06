import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { LeafMark } from "@/components/layout/leaf-mark";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { PaymentMarks } from "@/components/layout/payment-marks";
import { FooterGroup, type FooterLink } from "@/components/layout/footer-group";

const SHOP: FooterLink[] = [
  { href: "/shop", label: "The greenhouse" },
  { href: "/categories", label: "Categories" },
  { href: "/care", label: "Care notes" },
];

const COMPANY: FooterLink[] = [
  { href: "/about", label: "Our story" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

const SUPPORT: FooterLink[] = [
  { href: "/contact", label: "Repotting service" },
  { href: "/contact", label: "Delivery and returns" },
  { href: "/contact", label: "The plant doctor" },
];

// Placeholder handles. Confirm the real accounts before this ships.
const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/verdant" },
  { label: "Pinterest", href: "https://pinterest.com/verdant" },
  { label: "X", href: "https://x.com/verdant" },
];

/**
 * Site footer.
 *
 * Four columns on desktop. Below that the link columns fold into disclosures and
 * the newsletter stacks, so a phone gets one column and one decision at a time.
 * The wordmark along the bottom is decoration: it is aria-hidden and clipped by
 * its own overflow, so it reads as type rather than as a second logo.
 */
export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-warm-white">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10 lg:py-20">
        <div className="lg:pr-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg font-heading text-[1.5rem] leading-none font-semibold tracking-[-0.03em] text-ink"
          >
            <LeafMark className="size-7 text-forest" />
            Verdant
          </Link>
          <p className="mt-5 max-w-sm text-pretty text-body text-text-muted">
            A small nursery with strong opinions about drainage. Everything here
            has overwintered on our own shelf, and every care note was written by
            the person who potted it up.
          </p>
          <NewsletterForm className="mt-8 max-w-md" />
        </div>

        <FooterGroup title="Shop" links={SHOP} />
        <FooterGroup title="Company" links={COMPANY} />
        <FooterGroup title="Care and Support" links={SUPPORT} />
      </div>

      <div aria-hidden="true" className="overflow-hidden px-5">
        <p className="-mb-[0.21em] text-center font-heading text-[19vw] leading-[0.76] font-semibold tracking-[-0.05em] text-forest/10 select-none lg:text-[21vw]">
          Verdant
        </p>
      </div>

      <div className="border-t border-ink/10">
        <div className="container-x flex flex-col items-start gap-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-ink/70">
            © {new Date().getFullYear()} Verdant. Grown, repotted and posted by
            us.
          </p>

          <PaymentMarks />

          <ul className="flex items-center gap-5">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-1 text-small font-medium text-ink underline-offset-4 transition-colors duration-200 hover:text-forest hover:underline"
                >
                  {social.label}
                  <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
