import type { Metadata } from "next";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "How a plant travels from our bench to yours — delivery timings, boxes built to survive couriers, and the honest rules on returns and refunds.",
  alternates: { canonical: "/shipping-returns" },
};

const SECTIONS = [
  { id: "how-shipping-works", title: "How shipping works" },
  { id: "timings", title: "Delivery timings" },
  { id: "winter", title: "Winter and the weather" },
  { id: "returns-and-refunds", title: "Returns & refunds" },
  { id: "damaged-in-transit", title: "Damaged in transit" },
  { id: "the-guarantee", title: "The 30-day guarantee" },
] as const;

export default function ShippingReturnsPage() {
  return (
    <LegalPage
      eyebrow="Service"
      title="Shipping & returns"
      intro="Plants travel badly when they are thought of as parcels. Ours are packed like cargo that happens to photosynthesise — here is exactly how, and what we promise if it goes wrong."
      updatedLabel="September 2026"
      sections={SECTIONS}
    >
      <LegalSection id="how-shipping-works" title="How shipping works">
        <p>
          Every order is picked from the bench on the morning it ships, packed
          into a box sized to the plant and not a shared bin, and handed to the
          courier before noon. The pot is taped in place, the soil is damped but
          not soaked, and the leaves ride in paper rather than bare plastic.
          You pay one flat rate of <strong>$9.50</strong> per order, and shipping
          is free over <strong>$75</strong> — before tax, after any discounts.
        </p>
        <p>
          We pack and dispatch Thursday to Monday. Tuesdays and Wednesdays are
          growing days at the nursery, and the courier does not come anyway.
        </p>
      </LegalSection>

      <LegalSection id="timings" title="Delivery timings">
        <p>
          Inside the continental US, most orders arrive within two to five
          working days of dispatch. We do not ship to addresses outside the
          contiguous states, Alaska and Hawaii excepted on request for the
          hardier varieties — send a note from the contact page and we will
          tell you honestly whether it is worth the trip.
        </p>
        <p>
          Tracking lands in the email you ordered with, the morning the box
          leaves. If tracking goes quiet for more than a working day, write to
          us: we chase couriers harder than most, because we know what is in
          the box.
        </p>
      </LegalSection>

      <LegalSection id="winter" title="Winter and the weather">
        <p>
          In winter we hold dispatch if the forecast on the route is properly
          cruel — a plant that sits in a freezing depot for a night is a plant
          we will be refunding in a week. You can ask for a heat pack at
          checkout, free, and we will add it to the box without being asked if
          the route needs one.
        </p>
      </LegalSection>

      <LegalSection id="returns-and-refunds" title="Returns & refunds">
        <p>
          If an order arrives damaged or not as described, tell us within 48
          hours with a photograph and we will replace it or refund it in full —
          your choice. We do not ask you to send the plant back; a stressed
          plant has already travelled once, and we would rather you try to save
          it than send it on a second journey for a form&apos;s sake.
        </p>
        <p>
          Healthy plants that simply changed your mind can be returned to the
          greenhouse within 14 days for store credit, in their original pot and
          with the packing we shipped them in. Plants bought in store do not
          carry a cooling-off return, because you met them before you took them.
        </p>
      </LegalSection>

      <LegalSection id="damaged-in-transit" title="Damaged in transit">
        <p>
          A broken stem or a bruised leaf is on us. Since 2019 the packing log
          has not recorded a single box arriving with a broken stem — but
          couriers are couriers, and if it happens to yours, the photograph
          rules. Email the bench within 48 hours, and say hello when the
          replacement arrives.
        </p>
      </LegalSection>

      <LegalSection id="the-guarantee" title="The 30-day guarantee">
        <p>
          If a plant dies within 30 days of arrival and you have watered it with
          a finger, not a calendar, we replace it once, free — because
          sometimes a plant was sick before it left, and that is our fault to
          carry. The guarantee is one replacement per plant, and it does not
          cover plants fed on a schedule, drowned in love, or eaten by a
          particularly determined pet.
        </p>
      </LegalSection>
    </LegalPage>
  );
}