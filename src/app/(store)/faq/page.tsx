import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { FaqAccordion, type FaqItem } from "@/components/faq/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions from the front desk — shipping, watering, the repotting service and what to do when a plant arrives looking sorry for itself.",
  alternates: { canonical: "/faq" },
};

const QUESTIONS: FaqItem[] = [
  {
    question: "Do plants survive the post?",
    answer:
      "Yes — that is the whole job of the packing log. Every plant ships in a box built to survive a courier's day: the pot is taped down, the soil is damped but not soaked, and the plant is cushioned so the leaves ride rather than rub. Since 2019, not one box has arrived with a broken stem.",
  },
  {
    question: "How often should I actually water?",
    answer:
      "Never on a schedule — schedules are how houseplants drown. Stick a finger into the soil up to the second knuckle; water only when it feels dry there. The journal has a full, honest essay on this: ‘Watering intervals, honestly’.",
  },
  {
    question: "My plant arrived looking sorry for itself. What do I do?",
    answer:
      "Photograph it within 48 hours, email the bench, and keep it somewhere bright but out of direct sun. If it has genuinely been hurt in transit we replace it or refund it — no forms, no arguing, because we packed it and we know what that box went through.",
  },
  {
    question: "What is the repotting service?",
    answer:
      "Exactly what it sounds like: bring us a plant that has outgrown its pot (or is sulking in one that does not fit), and Theo will repot it while you wait, with the right mix for that species. Drop-off is Thursday to Monday; the average wait is twenty minutes and a cup of tea.",
  },
  {
    question: "Do you ship nationwide?",
    answer:
      "Yes — every state in the contiguous US, year round. In deep winter we add heat packs to the box on request, and we hold dispatches if the forecast is properly cruel. The full rules and timings are on the shipping and returns page.",
  },
  {
    question: "Can I visit the greenhouse?",
    answer:
      "Please do. We are at Bench 4, Kiln Lane, open Thursday to Monday, 9–5 — and we close on Tuesdays and Wednesdays to grow. The door is on the contact page, and the kettle is usually on.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-warm-white">
      <section className="pt-10 pb-10 lg:pt-14 lg:pb-12">
        <div className="container-x">
          <p className="eyebrow">Before you ask</p>
          <h1 className="mt-3 max-w-2xl font-heading text-h1 font-semibold tracking-[-0.03em] text-ink">
            The questions the front desk hears most.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-body leading-relaxed text-ink/70">
            Six answers, written the way we&apos;d give them over the counter.
            If yours is not here, the contact form is one page away.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-x">
          <div className="max-w-3xl">
            <FaqAccordion items={QUESTIONS} />

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-mint/45 px-6 py-5">
              <div>
                <p className="font-heading text-lg font-semibold text-ink">
                  Still not answered?
                </p>
                <p className="mt-1 text-body text-ink/70">
                  Ask a person — the reply is from a nursery, not a bot.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-forest px-5 text-small font-medium text-white transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Ask us
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}