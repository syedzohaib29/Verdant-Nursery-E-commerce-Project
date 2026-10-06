import { NewsletterForm } from "@/components/layout/newsletter-form";
import { Reveal } from "@/components/motion/reveal";

/*
  Newsletter band.

  Mint rather than forest, which is the only reason the existing NewsletterForm can
  be reused unchanged: its muted helper text is ink at 60%, which clears AA on mint
  and does not clear it on forest. Restyling one field per surface would mean two
  colour systems for the same control.

  Deliberately no subscriber count. A database with fourteen rows in it is the kind
  of number that is technically true and reads as a lie.
*/
export function NewsletterBand() {
  return (
    <section className="bg-mint py-16 lg:py-20">
      <div className="container-x grid gap-y-10 lg:grid-cols-12 lg:items-end lg:gap-x-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">One letter a month</p>
          <h2 className="mt-3 max-w-[14ch] text-h2 text-ink">
            What came through the bench, and what we got wrong.
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
          <p className="max-w-prose text-pretty text-body text-text-muted">
            No offers, no countdown timers, and no more than one email a month.
            Unsubscribe in one click, from the bottom of every issue rather than
            from a settings page nobody visits.
          </p>

          <NewsletterForm className="mt-6 max-w-md" />
        </Reveal>
      </div>
    </section>
  );
}