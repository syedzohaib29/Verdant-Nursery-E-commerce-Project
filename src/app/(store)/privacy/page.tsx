import type { Metadata } from "next";

import {
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Verdant collects, why, and who it is shared with — in plain words, without the legalese you skip anyway.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  { id: "what-we-collect", title: "What we collect" },
  { id: "why-we-collect-it", title: "Why we collect it" },
  { id: "who-we-share-it-with", title: "Who we share it with" },
  { id: "cookies", title: "Cookies" },
  { id: "your-rights", title: "Your rights" },
  { id: "questions", title: "Questions" },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="Rules for the one piece of mail that matters: what we know about you, why we keep it, and who it is ever shown to. Written so you do not have to skim."
      updatedLabel="September 2026"
      sections={SECTIONS}
    >
      <LegalSection id="what-we-collect" title="What we collect">
        <p>
          The ordinary things an order needs: your name, email address,
          delivery address, and what you bought. If you write to us through the
          contact form, we keep your message and your email so we can answer
          it — nothing more is harvested from the form, and the address field
          you cannot see is for robots, not for us.
        </p>
        <p>
          When you pay, the card details go straight to our payment provider
          over an encrypted connection. We never see or store a full card
          number on our own servers.
        </p>
      </LegalSection>

      <LegalSection id="why-we-collect-it" title="Why we collect it">
        <p>
          To send you the plants you paid for, to tell you when they ship, to
          honour the guarantee, and to answer the messages you send. That is
          the whole list. We do not build advertising profiles, sell address
          lists, or run re-targeting pixels on the greenhouse.
        </p>
        <p>
          If you join the newsletter, we only ever send gardening notes and
          bench news — the email contains an unsubscribe link that actually
          works, because a newsletter you cannot leave is spam by another name.
        </p>
      </LegalSection>

      <LegalSection id="who-we-share-it-with" title="Who we share it with">
        <p>
          The delivery courier needs your address to bring the box; our payment
          provider needs your card to take payment; and that is the entire
          list of people who touch your data. Each is bound to use it only for
          the job given, and none may sell it on.
        </p>
        <p>
          We never share or sell your name to a mailing-list broker, a
          recommender, or a marketing agency — you will not find your inbox
          fuller because you bought a Monstera from us.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          We use the small handful of cookies a working shop needs: one for
          your basket, one for staying signed in, and the payment provider&apos;s
          own session cookie at checkout. There are no third-party tracking
          cookies, no analytics cookies that follow you around the web, and no
          fingerprinting. Accepting them all or none of them will not change
          the price of a single plant.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your rights">
        <p>
          You can ask us, at any time, for a copy of everything we hold about
          you, to have it corrected, or to have it deleted — and we will do it
          within 30 days, without making you pay or jump through a form that
          exists to wear you out. Email the bench from the contact page and
          mark the message &ldquo;data request&rdquo;.
        </p>
        <p>
          We keep order records as long as tax law requires and the guarantee
          is alive (30 days after the last order), and not a day past that out
          of habit.
        </p>
      </LegalSection>

      <LegalSection id="questions" title="Questions">
        <p>
          Anything you read here that does not match the shop you actually
          experienced, tell us — that is the one thing this policy cannot
          cover by writing tighter. Reach the privacy desk through the contact
          form; it lands on the same bench as everything else, and only Mara
          reads it.
        </p>
      </LegalSection>
    </LegalPage>
  );
}