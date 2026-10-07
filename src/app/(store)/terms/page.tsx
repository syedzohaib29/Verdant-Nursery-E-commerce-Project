import type { Metadata } from "next";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The honest terms of buying from a nursery: prices, payments, the small print about plants being alive, and what we are liable for.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  { id: "the-shop", title: "The shop" },
  { id: "prices-and-payment", title: "Prices & payment" },
  { id: "plants-are-alive", title: "Plants are living things" },
  { id: "delivery-and-returns", title: "Delivery & returns" },
  { id: "liability", title: "What we are liable for" },
  { id: "governing-law", title: "Governing law" },
] as const;

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of sale"
      intro="The contract between us when you buy a plant. Kept short on purpose: the nursery believes the small print should fit on one page, like a care note."
      updatedLabel="September 2026"
      sections={SECTIONS}
    >
      <LegalSection id="the-shop" title="The shop">
        <p>
          Verdant is a nursery, not a warehouse. The plants and planters on the
          bench are ours — really ours, grown or overwintered on our own shelf
          before they get a price tag. When you place an order you are buying
          from us directly, and the contract between us is formed when we
          confirm your order and pick the plant, not when you press the button.
        </p>
      </LegalSection>

      <LegalSection id="prices-and-payment" title="Prices & payment">
        <p>
          Prices are in US dollars and include nothing you have not seen at
          checkout: the plant, the box, and the flat shipping rate the shipping
          page spells out. Payment is taken at checkout through our payment
          provider, and the price on the bench is the price you pay — we do not
          charge more at the last step, and we never have.
        </p>
        <p>
          Promotions apply at checkout exactly as shown. A sale price is
          honoured if it is live on the shelf when you pay, not when you
          bookmark it.
        </p>
      </LegalSection>

      <LegalSection id="plants-are-alive" title="Plants are living things">
        <p>
          Every plant is dispatched healthy, watered, and packed for the
          journey — that is the packing log&apos;s whole job. But no nursery can
          contract for the future of a living thing: once a plant is in your
          care, how it fares is yours. That is what the guarantee exists to
          balance, and it is written generously in our favour of you.
        </p>
      </LegalSection>

      <LegalSection id="delivery-and-returns" title="Delivery & returns">
        <p>
          Delivery timings, the winter rules, and the full returns policy live
          on the shipping &amp; returns page and are part of these terms by
          reference. The short version: damaged in transit, tell us in 48
          hours with a photo and it is replaced or refunded; a plant that dies
          within 30 days is replaced once, free.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="What we are liable for">
        <p>
          Our liability is limited to the price you paid for the goods in
          question. We are not liable for losses that follow from a plant&apos;s
          condition after delivery — a plant that was healthy when it left us,
          and that a pet, a draft, or a watering schedule then finished off, is
          not our responsibility. Nothing in these terms limits liability that
          the law does not allow a shop to limit.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="Governing law">
        <p>
          These terms are governed by the laws of the State of Oregon, and the
          courts of Multnomah County have jurisdiction. If any part of them is
          found unenforceable, the rest still stands — and if you are
          somewhere the law treats you more generously, the law wins. We would
          rather be fair than be right.
        </p>
      </LegalSection>
    </LegalPage>
  );
}