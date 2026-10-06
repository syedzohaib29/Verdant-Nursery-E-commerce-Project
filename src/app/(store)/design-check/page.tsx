import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSuccess,
} from "@/components/ui/field";
import { SectionHeading } from "@/components/layout/section-heading";
import { LeafMark } from "@/components/layout/leaf-mark";
import { PaymentMarks } from "@/components/layout/payment-marks";
import {
  CartBadgeDemo,
  LoadingButtonDemo,
  RevealDemo,
} from "./demo-widgets";

import { cn } from "cn";

export const metadata: Metadata = {
  title: "Design check",
  description: "Temporary page for checking the design system.",
};

/** Temporary. This route is deleted in Phase 10. */
export default function DesignCheckPage() {
  return (
    <div className="bg-surface-page">
      <section className="py-16">
        <div className="container-x">
          <p className="eyebrow">Design check</p>
          <h1 className="mt-4 text-h1 text-ink">
            Everything in one place, so nothing gets argued about later.
          </h1>
          <p className="mt-4 max-w-xl text-body text-text-muted">
            Type, colour, surfaces, radius, controls and motion. Delete this route
            in Phase 10 once the rest of the site is carrying itself.
          </p>
        </div>
      </section>

      {/* Type scale */}
      <section className="bg-white py-16" aria-labelledby="type-scale">
        <div className="container-x">
          <SectionHeading
            id="type-scale"
            eyebrow="Typography"
            title="Six sizes, each a clamp()."
            description="Every step hits its floor at 360px and its ceiling between 1024 and 1440px, so no heading needs a per-breakpoint override."
          />

          <dl className="mt-12 divide-y divide-ink/10 border-t border-ink/10">
            {[
              {
                token: "text-display",
                spec: "3rem → 7.5rem",
                sample: (
                  <p className="text-display text-ink">Drainage first</p>
                ),
              },
              {
                token: "text-h1",
                spec: "2.25rem → 4rem",
                sample: <p className="text-h1 text-ink">Sixty varieties</p>,
              },
              {
                token: "text-h2",
                spec: "1.75rem → 3rem",
                sample: (
                  <p className="text-h2 text-ink">Name the spot first</p>
                ),
              },
              {
                token: "text-h3",
                spec: "1.375rem → 2rem",
                sample: (
                  <p className="text-h3 text-ink">Test the soil, not the clock</p>
                ),
              },
              {
                token: "text-body",
                spec: "1rem → 1.125rem",
                sample: (
                  <p className="max-w-2xl text-body text-text-muted">
                    Overwatering and wrong light account for most of what we see
                    on the returns bench. Neither is expensive to fix.
                  </p>
                ),
              },
              {
                token: "text-small",
                spec: "0.8125rem → 0.875rem",
                sample: (
                  <p className="text-small text-text-muted">
                    Monstera deliciosa · 18.06.2026
                  </p>
                ),
              },
            ].map((row) => (
              <div
                key={row.token}
                className="grid gap-4 py-8 lg:grid-cols-[14rem_1fr] lg:gap-12"
              >
                <div>
                  <dt className="font-heading text-[0.9375rem] font-semibold text-forest">
                    {row.token}
                  </dt>
                  <dd className="tabular-nums mt-1 text-small text-text-muted">
                    {row.spec}
                  </dd>
                </div>
                <dd>{row.sample}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-ink/10 pt-8">
            <p className="eyebrow">Eyebrow, 12px / 0.12em</p>
            <p className="eyebrow-inverse rounded-lg bg-forest px-3 py-1.5">
              Eyebrow on forest
            </p>
            <p className="eyebrow rounded-lg bg-mint px-3 py-1.5">
              Eyebrow on mint
            </p>
          </div>
        </div>
      </section>

      {/* Colour */}
      <section className="bg-surface-page py-16" aria-labelledby="colour">
        <div className="container-x">
          <SectionHeading
            id="colour"
            eyebrow="Colour"
            title="Green, white and black. Nothing else earns a place."
            description="Forest carries text on light backgrounds. Leaf is 3.5:1 on white and 3.0:1 on mint, so it is reserved for surfaces, accents and the focus ring."
          />

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "ink", hex: "#0B0F0C", className: "bg-ink", note: "19.4:1 on white" },
              { name: "forest", hex: "#14532D", className: "bg-forest", note: "9.1:1 on white" },
              { name: "leaf", hex: "#3E9B4F", className: "bg-leaf", note: "3.5:1 — accents only" },
              { name: "mint", hex: "#E6F2E8", className: "bg-mint", note: "Sunken surface" },
              { name: "warm-white", hex: "#F8F8F4", className: "bg-warm-white", note: "Page surface" },
              { name: "white", hex: "#FFFFFF", className: "bg-white", note: "Card surface" },
            ].map((swatch) => (
              <li key={swatch.name}>
                <div
                  className={cn(
                    "flex h-24 items-end rounded-lg border border-ink/10 p-3",
                    swatch.className,
                  )}
                >
                  <span
                    className={cn(
                      "font-heading text-[0.9375rem] font-semibold",
                      swatch.name === "mint" || swatch.name === "warm-white"
                        ? "text-ink"
                        : "text-white",
                    )}
                  >
                    {swatch.name}
                  </span>
                </div>
                <p className="tabular-nums mt-2 text-small text-ink">
                  {swatch.hex}
                </p>
                <p className="text-small text-text-muted">{swatch.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Surfaces, radius, elevation */}
      <section className="bg-white py-16" aria-labelledby="surfaces">
        <div className="container-x">
          <SectionHeading
            id="surfaces"
            eyebrow="Surfaces"
            title="Four levels, three radii, two shadows."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "page", className: "bg-warm-white" },
              { name: "card", className: "bg-white" },
              { name: "sunken", className: "bg-mint" },
              { name: "inverse", className: "bg-forest" },
            ].map((surface) => (
              <div
                key={surface.name}
                className={cn(
                  "flex h-32 flex-col justify-between rounded-lg border border-ink/10 p-4",
                  surface.className,
                )}
              >
                <p
                  className={
                    surface.name === "inverse" ? "eyebrow-inverse" : "eyebrow"
                  }
                >
                  {surface.name}
                </p>
                <p
                  className={cn(
                    "text-small",
                    surface.name === "inverse" ? "text-mint/85" : "text-text-muted",
                  )}
                >
                  Body copy lands here.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 border-t border-ink/10 pt-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="eyebrow">Radius scale</p>
              <div className="mt-4 flex flex-wrap items-end gap-6">
                {["12", "20", "28"].map((radius) => (
                  <div key={radius} className="text-center">
                    <div
                      className="size-20 border border-ink/15 bg-warm-white"
                      style={{ borderRadius: `${radius}px` }}
                    />
                    <p className="tabular-nums mt-2 text-small text-text-muted">
                      {radius}px
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow">Elevation</p>
              <div className="mt-4 flex flex-wrap gap-6">
                <div className="rounded-xl bg-white p-5 shadow-soft">
                  <p className="text-small font-medium">shadow-soft</p>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-lift">
                  <p className="text-small font-medium">shadow-lift</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="bg-surface-page py-16" aria-labelledby="buttons">
        <div className="container-x">
          <SectionHeading
            id="buttons"
            eyebrow="Controls"
            title="Two heights, six variants, one press feel."
            description="44px and 48px, a 0.97 press scale, a 200ms hover, and a 2px leaf focus ring everywhere. Every interactive target is at least a fingertip."
          />

          <div className="mt-12 flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="sunken">Sunken</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="secondary" size="icon" aria-label="Arrow">
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="primary" size="lg">
              Primary, 48px
            </Button>
            <Button variant="secondary" size="lg">
              Secondary, 48px
            </Button>
            <Button variant="primary" size="lg" loading>
              Loading
            </Button>
          </div>

          <div className="mt-4 rounded-lg bg-forest p-6">
            <p className="eyebrow-inverse mb-4">Inverted, on a forest surface</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="inverted">Inverted</Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/15"
              >
                Ghost on forest
              </Button>
            </div>
          </div>

          <div className="mt-10 border-t border-ink/10 pt-10">
            <LoadingButtonDemo />
          </div>

          <div className="mt-8 border-t border-ink/10 pt-10">
            <CartBadgeDemo />
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className="bg-white py-16" aria-labelledby="inputs">
        <div className="container-x">
          <SectionHeading
            id="inputs"
            eyebrow="Fields"
            title="Label, error and success, wired for assistive tech."
            description="The Field primitive owns the ids: the label points at the control, the control points at its message, and an invalid field is announced as invalid."
          />

          <div className="mt-12 grid max-w-2xl gap-10">
            <Field>
              <FieldLabel htmlFor="check-resting">Resting state</FieldLabel>
              <FieldControl
                render={<Input id="check-resting" placeholder="Bright indirect light" />}
              />
              <FieldDescription>
                Where the plant lives, in words you would use out loud.
              </FieldDescription>
            </Field>

            <Field invalid>
              <FieldLabel htmlFor="check-email">Error state</FieldLabel>
              <FieldControl
                render={
                  <Input
                    id="check-email"
                    type="email"
                    defaultValue="verdant.example"
                    aria-describedby="check-email-error"
                  />
                }
              />
              <FieldError id="check-email-error">
                That does not look like an email address.
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="check-valid">Success state</FieldLabel>
              <FieldControl
                render={<Input id="check-valid" defaultValue="hello@verdant.co" />}
              />
              <FieldSuccess>We can reach you at this address.</FieldSuccess>
            </Field>

            <Field disabled>
              <FieldLabel htmlFor="check-disabled">Disabled</FieldLabel>
              <FieldControl
                render={<Input id="check-disabled" placeholder="Repotting day" disabled readOnly />}
              />
              <FieldDescription>Available again on Thursday.</FieldDescription>
            </Field>
          </div>

          <p className="mt-12 border-t border-ink/10 pt-8 text-small text-text-muted">
            The newsletter in the footer of this page is the same component, wired
            to the same server action. Submit it empty to see the error state.
          </p>
        </div>
      </section>

      {/* Shell */}
      <section className="bg-surface-sunken py-16" aria-labelledby="shell">
        <div className="container-x">
          <SectionHeading
            id="shell"
            eyebrow="Shell"
            title="The frame is live on this page too."
            description="Navbar and footer sit in the root layout, so they survive every navigation and never re-animate. The mobile sheet, the command palette and the footer accordions are all reachable from here."
          />

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button variant="secondary" nativeButton={false} render={<Link href="/shop" />}>
              Shop page
            </Button>
            <Button variant="secondary" nativeButton={false} render={<Link href="/care" />}>
              Care page
            </Button>
            <p className="text-small text-text-muted">
              Press ⌘K, or the search button, for the command palette. Narrow the
              window for the sheet and the footer accordions.
            </p>
          </div>

          <div className="mt-12 border-t border-ink/10 pt-10">
            <RevealDemo />
          </div>
        </div>
      </section>

      {/* Brand and payments */}
      <section className="bg-surface-page py-16" aria-labelledby="brand">
        <div className="container-x">
          <SectionHeading id="brand" eyebrow="Marks" title="Brand and payment chips." />
          <div className="mt-10 flex flex-wrap items-center gap-12">
            <div className="flex items-center gap-2 font-heading text-[2rem] font-semibold tracking-[-0.03em] text-ink">
              <LeafMark className="size-9 text-forest" />
              Verdant
            </div>
            <PaymentMarks />
          </div>
        </div>
      </section>
    </div>
  );
}
