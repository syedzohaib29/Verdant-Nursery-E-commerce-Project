import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { CountUp } from "@/components/about/count-up";
import { Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Verdant is a small nursery founded in 2017 — four people, strong opinions about drainage, and everything we sell has overwintered on our own shelf first.",
  alternates: { canonical: "/about" },
};

const TEAM = [
  {
    name: "Mara Quinn",
    role: "Head grower",
    initials: "MQ",
    fact: "Names every plant after a soap opera character she stopped watching in 2009. The Monstera is called Deirdre.",
  },
  {
    name: "Theo Lindqvist",
    role: "Plant doctor",
    initials: "TL",
    fact: "Can tell whether a pot needs watering from the sound it makes when he flicks the rim — and is right about it embarrassingly often.",
  },
  {
    name: "Priya Nath",
    role: "Greenhouse manager",
    initials: "PN",
    fact: "Keeps a spreadsheet of how each variety's leaves unfurl, updated every morning at six, rain or shine.",
  },
  {
    name: "Sam Okafor",
    role: "Shop and delivery lead",
    initials: "SO",
    fact: "Has packed every plant we have ever shipped and logs each box like a postmaster — not one broken stem since 2019.",
  },
] as const;

const VALUES = [
  {
    title: "Grow it first",
    body: "Nothing sells from a picture. Every plant on the bench has overwintered on our own shelf — if it sulks at our place, it does not get a price tag.",
  },
  {
    title: "Say what a plant needs",
    body: "Care notes are written by the person who potted the plant, not a copywriter. If a calathea is going to be difficult, the note says so.",
  },
  {
    title: "Stay small on purpose",
    body: "We turn down wholesale orders that would outgrow the bench. Small means the plant you get was looked at today, by somebody whose name you can ask for.",
  },
] as const;

const MILESTONES = [
  {
    year: "2017",
    title: "Three benches and a leaky van",
    body: "Mara and Theo start rooting cuttings on the windowsill at Kiln Lane, and discover the van leaks exactly over the fiddle-leaf figs.",
  },
  {
    year: "2019",
    title: "The shopfront goes live",
    body: "Verdant begins posting plants instead of just selling them over the counter — and the packing log starts, after one memorable echeveria incident.",
  },
  {
    year: "2021",
    title: "The repotting service",
    body: "The plant doctor officially opens a door. Bring us a plant in trouble; leave with one in a pot that fits it.",
  },
  {
    year: "2023",
    title: "A thousand plants in a season",
    body: "The first spring we shipped more plants than we grew sprouts. Priya joins; the unfurl spreadsheet is born.",
  },
  {
    year: "2026",
    title: "Still a small nursery, on purpose",
    body: "Nine benches, four people, one leaky van replaced by a very good one. The opinions about drainage have not mellowed.",
  },
] as const;

const NUMBERS = [
  {
    value: 9,
    suffix: "",
    label: "Years on the bench",
  },
  {
    value: 12000,
    suffix: "+",
    label: "Plants shipped, none bruised",
  },
  {
    value: 40,
    suffix: "+",
    label: "Varieties in rotation",
  },
  {
    value: 4,
    suffix: "",
    label: "People, one nursery",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="bg-warm-white">
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="container-x">
          <p className="eyebrow">Since 2017</p>
          <h1 className="mt-3 max-w-3xl font-heading text-h1 font-semibold tracking-[-0.03em] text-ink">
            A small nursery with strong opinions about drainage.
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <p className="max-w-2xl text-pretty text-body leading-relaxed text-ink/70">
              Four people, nine benches and a packing log that has not missed a
              day since 2019. Everything here grew up on our own shelf first —
              and the care notes are written by the hands that potted it.
            </p>
            <Link
              href="/shop"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-forest px-6 text-base font-medium text-white transition-colors duration-200 hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Visit the greenhouse
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------- Photo-led, overlapping --------------------- */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <Stagger>
              <StaggerItem>
                <p className="eyebrow">The story</p>
                <h2 className="mt-3 font-heading text-h3 font-semibold tracking-[-0.02em] text-ink">
                  It started with a leaky van and windowsill cuttings.
                </h2>
              </StaggerItem>
              <StaggerItem>
                <p className="mt-5 text-pretty text-body leading-relaxed text-ink/75">
                  Kiln Lane, 2017: a rented bench, thirty cuttings and a very
                  firm opinion that drainage holes are not optional. The first
                  summer we sold plants from the tailgate of a van that leaked
                  only over the fiddle-leaf figs — which is how we learned to
                  love a plant that complains loudly.
                </p>
              </StaggerItem>
              <StaggerItem>
                <p className="mt-4 text-pretty text-body leading-relaxed text-ink/75">
                  Nine years later the bench count is up and the opinions are
                  unchanged: grow it on our shelf first, say what it needs in
                  plain words, and stay small enough to know every plant we
                  send out.
                </p>
              </StaggerItem>
            </Stagger>
          </div>

          {/* The collage: two overlaps, deliberate, none of them centered. */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="relative mx-auto max-w-xl pb-10 lg:pb-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mint shadow-lift">
                <Image
                  src="/images/monstera-deliciosa-1.webp"
                  alt="A mature Monstera deliciosa with split leaves, grown at the nursery"
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="object-cover"
                />
              </div>

              <div className="absolute -bottom-0 left-0 w-1/2 rotate-[-2deg] overflow-hidden rounded-xl border-4 border-white bg-mint shadow-lift lg:-bottom-4 lg:-left-6">
                <div className="aspect-square">
                  <Image
                    src="/images/fiddle-leaf-fig-1.webp"
                    alt="A fiddle-leaf fig leaning toward the light"
                    fill
                    sizes="(min-width: 1024px) 20vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="absolute top-0 right-0 w-2/5 rotate-[2.5deg] overflow-hidden rounded-xl border-4 border-white bg-mint shadow-lift lg:-top-6 lg:right-6 lg:translate-x-[6%]">
                <div className="aspect-[4/5]">
                  <Image
                    src="/images/boston-fern-1.webp"
                    alt="A full, feathery Boston fern"
                    fill
                    sizes="(min-width: 1024px) 16vw, 34vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- Numbers ------------------------------ */}
      <section className="bg-forest py-14 lg:py-18">
        <div className="container-x">
          <p className="eyebrow-inverse">In numbers</p>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {NUMBERS.map(({ value, suffix, label }) => (
              <div key={label}>
                <p className="font-heading text-[2.75rem] leading-none font-semibold tracking-[-0.03em] text-white lg:text-5xl">
                  <CountUp to={value} suffix={suffix} />
                </p>
                <p className="mt-2 max-w-[12ch] text-small text-mint/75">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- Values ------------------------------ */}
      <section className="bg-mint/45 py-14 lg:py-20">
        <div className="container-x">
          <p className="eyebrow">What we&apos;re for</p>
          <h2 className="mt-3 max-w-2xl font-heading text-h3 font-semibold tracking-[-0.02em] text-ink">
            Three rules the whole nursery works by.
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {VALUES.map((value, index) => (
              <article
                key={value.title}
                className="rounded-2xl border border-ink/10 bg-white p-6 shadow-lift sm:p-7"
              >
                <p className="font-heading text-sm font-semibold tracking-[0.12em] text-forest uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-heading text-xl font-semibold tracking-[-0.015em] text-ink">
                  {value.title}
                </h3>
                <p className="mt-3 text-pretty text-body leading-relaxed text-ink/70">
                  {value.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- Timeline ----------------------------- */}
      <section className="bg-warm-white py-16 lg:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">The years</p>
            <h2 className="mt-3 font-heading text-h3 font-semibold tracking-[-0.02em] text-ink">
              Nine years, told in milestones — not buzzwords.
            </h2>
            <p className="mt-4 text-pretty text-body leading-relaxed text-ink/70">
              The bench got bigger and the van got better. Everything else went
              the way of strong opinions and slow plants.
            </p>
          </div>

          <ol className="relative lg:col-span-8">
            <div
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-[1.375rem] w-px bg-ink/15"
            />
            {MILESTONES.map(({ year, title, body }) => (
              <li key={year} className="relative flex gap-6 pb-9 last:pb-0">
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1 grid size-11 shrink-0 place-items-center rounded-full border border-ink/10 bg-white font-heading text-sm font-semibold text-forest shadow-lift"
                >
                  {year}
                </span>
                <div className="pt-1">
                  <h3 className="font-heading text-lg font-semibold tracking-[-0.015em] text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-lg text-pretty text-body leading-relaxed text-ink/70">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------ Team ------------------------------- */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container-x">
          <p className="eyebrow">The people</p>
          <h2 className="mt-3 max-w-2xl font-heading text-h3 font-semibold tracking-[-0.02em] text-ink">
            Four people, one nursery, no staff photo — so here&apos;s proof by
            fact instead.
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <article
                key={member.name}
                className="flex flex-col rounded-2xl border border-ink/10 bg-warm-white p-6"
              >
                <span
                  aria-hidden="true"
                  className="grid size-14 place-items-center rounded-full bg-mint font-heading text-lg font-semibold text-forest"
                >
                  {member.initials}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-[-0.015em] text-ink">
                  {member.name}
                </h3>
                <p className="text-small font-medium tracking-wide text-forest uppercase">
                  {member.role}
                </p>
                <p className="mt-3 text-pretty text-body leading-relaxed text-ink/70">
                  {member.fact}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- CTA ------------------------------- */}
      <section className="bg-ink py-16 lg:py-20">
        <div className="container-x flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="eyebrow-inverse">Nursery doors</p>
            <h2 className="mt-3 max-w-xl font-heading text-h3 font-semibold text-white">
              The bench is open — come smell the potting mix.
            </h2>
            <p className="mt-3 max-w-lg text-pretty text-body text-white/70">
              Questions about a plant, the repotting service, or just a second
              opinion on drainage: the front door is always open.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-base font-medium text-forest transition-colors duration-200 hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
              Say hello
            </Link>
            <Link
              href="/journal"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-6 text-base font-medium text-white transition-colors duration-200 hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
              Read the journal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}