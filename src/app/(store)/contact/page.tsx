import type { Metadata } from "next";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { MapIllustration } from "@/components/contact/map-illustration";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Say hello — orders, plant questions, the repotting service, wholesale or press. Real people at a real nursery reply within two working days.",
  alternates: { canonical: "/contact" },
};

/**
 * The front door.
 *
 * Two jobs in one page: a form that lands in the back office's message desk,
 * and the same three facts a person would look for on the counter — email,
 * phone, address — read from the settings row the staff already edits.
 */
export default async function ContactPage() {
  const settings = await getSettings();

  const desks = [
    {
      icon: MailIcon,
      label: "Email",
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    {
      icon: PhoneIcon,
      label: "Phone",
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone.replace(/[^+\d]/g, "")}`,
    },
    {
      icon: MapPinIcon,
      label: "The greenhouse",
      value: settings.address,
      href: null,
    },
  ] as const;

  return (
    <div className="bg-warm-white">
      <section className="pt-10 pb-10 lg:pt-14 lg:pb-12">
        <div className="container-x">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 max-w-2xl font-heading text-h1 font-semibold tracking-[-0.03em] text-ink">
            Say hello — we answer like a nursery should.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-body leading-relaxed text-ink/70">
            Orders, wilting leaves, wholesale lists or the repotting service:
            the message lands on a desk the whole team reads, not a ticket
            queue. Two working days, usually faster.
          </p>
        </div>
      </section>

      <div className="container-x">
        <div className="grid gap-10 pb-20 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ContactForm />

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-lift">
              <h2 className="font-heading text-lg font-semibold text-ink">
                Straight to a person
              </h2>
              <ul className="mt-5 space-y-4">
                {desks.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-mint">
                      <Icon aria-hidden="true" className="size-4.5 text-forest" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-small font-medium tracking-wide text-ink/50 uppercase">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="mt-0.5 inline-block min-h-11 pt-1 text-body font-medium text-forest underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-pretty text-body font-medium text-ink">
                          {value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-mint">
                    <ClockIcon aria-hidden="true" className="size-4.5 text-forest" />
                  </span>
                  <div>
                    <p className="text-small font-medium tracking-wide text-ink/50 uppercase">
                      Neither of us answers at midnight
                    </p>
                    <p className="mt-0.5 text-body font-medium text-ink">
                      Thursday to Monday, 9&ndash;5. We grow on Tuesdays and
                      Wednesdays.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lift">
              <MapIllustration />
              <p className="border-t border-ink/10 px-6 py-4 text-small text-ink/60">
                Bench 4, Kiln Lane — the pin is a drawing, but the nursery is
                real, and the door is open on open days.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}