import type { ReactNode } from "react";

/**
 * The shell every long-form legal page shares: a hero, an "on this page" list
 * that settles into a sticky column once the content is long enough to deserve
 * one, and a comfortable measure for the words themselves.
 *
 * Pages with a single section skip the table of contents entirely — a TOC
 * with one entry is a waste of a sidebar.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedLabel,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedLabel: string;
  sections: readonly { id: string; title: string }[];
  children: ReactNode;
}) {
  const showToc = sections.length > 1;

  return (
    <div className="bg-warm-white">
      <section className="pt-10 pb-10 lg:pt-14 lg:pb-12">
        <div className="container-x">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 max-w-2xl font-heading text-h1 font-semibold tracking-[-0.03em] text-ink">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-body leading-relaxed text-ink/70">
            {intro}
          </p>
          <p className="mt-5 text-small font-medium tracking-wide text-ink/50 uppercase">
            Updated {updatedLabel}
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-x grid gap-10 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-14">
          {showToc ? (
            <nav
              aria-label="On this page"
              className="max-lg:hidden lg:sticky lg:top-28 lg:self-start"
            >
              <p className="eyebrow">On this page</p>
              <ol className="mt-4 space-y-0.5 border-l border-ink/15">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-small text-ink/65 transition-colors duration-200 hover:border-forest hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="min-w-0 max-w-[46rem]">
            <div className="space-y-12">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * One headed block of legal copy. The heading anchors the TOC entry; the body
 * sits on the same 1.7 line height and 65–72ch measure as the journal, because
 * a long page reads the same whether it is care advice or legal copy.
 */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <h2
        id={`${id}-heading`}
        className="font-heading text-h3 font-semibold tracking-[-0.02em] text-ink"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-ink/75">{children}</div>
    </section>
  );
}