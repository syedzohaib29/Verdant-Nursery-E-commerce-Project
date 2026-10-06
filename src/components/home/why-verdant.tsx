import Image from "next/image";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

/*
  Why Verdant.

  The one full-bleed reversal on the page. Three claims, numbered and hung off a
  single hairline so they read as a list of positions rather than a row of
  feature cards. The photograph is cropped off-square with an uneven radius: a
  rectangle with four identical corners sits next to type as decoration, and an
  irregular one sits next to it as a picture of something.
*/

const POINTS = [
  {
    number: "01",
    title: "We winter them here first.",
    body: "Nothing leaves the bench until it has survived a real winter in a real room with real radiators. That is slower than buying in and marking up, and it is the only reason our returns rate is low enough to be worth mentioning.",
  },
  {
    number: "02",
    title: "The card says the light, not the vibe.",
    body: "Every plant goes out with the spot it expects named on the card, in plain words. If we are not sure how much light your window gives you, we would rather you bought the snake plant than the fiddle leaf fig.",
  },
  {
    number: "03",
    title: "We would rather lose the sale.",
    body: "Ask how much light you have and we will tell you which of our plants will not survive it. It costs the order. It earns the next four, plus the part where you tell your friend this shop is honest.",
  },
] as const;

export function WhyVerdant({ image }: { image: string }) {
  return (
    <section className="bg-forest py-16 text-white lg:py-24">
      <div className="container-x">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow-inverse">Why Verdant</p>
            <h2 className="mt-4 max-w-[15ch] text-h2 text-white">
              A shop that turns down money is easy to run.
            </h2>
            <p className="mt-6 max-w-lg text-pretty text-body text-mint/85">
              The plants are the easy part. Keeping a business honest about what it
              does not know is the slow part, and it is the reason people come back
              for a second plant instead of a first one.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem_2.5rem_7rem_1rem] bg-forest/40">
              <Image
                src={image}
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1024px) 30vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-y-10 border-t border-white/20 pt-10 sm:grid-cols-3 sm:gap-x-10 lg:mt-20">
          {POINTS.map((point) => (
            <StaggerItem key={point.number}>
              <article>
                <p className="tabular-nums text-[0.75rem] font-medium tracking-[0.12em] text-mint/70 uppercase">
                  {point.number}
                </p>
                <h3 className="mt-4 max-w-[20ch] text-h3 text-white">
                  {point.title}
                </h3>
                <p className="mt-3 max-w-sm text-pretty text-small leading-relaxed text-mint/80">
                  {point.body}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}