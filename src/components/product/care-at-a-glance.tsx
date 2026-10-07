import {
  DropletsIcon,
  GaugeIcon,
  PawPrintIcon,
  RulerIcon,
  SunIcon,
} from "lucide-react";

import {
  DIFFICULTY_LABELS,
  LIGHT_LEVEL_LABELS,
  WATER_LEVEL_LABELS,
} from "@/lib/constants";

/**
 * Care at a glance.
 *
 * Five facts in a row, all of them things people get wrong when they buy a plant.
 * Every icon is the same 20px at the same 1.75 stroke, and every label is the same
 * size: a row where the labels differ in size reads as a list of different kinds of
 * thing rather than five answers to the same question.
 *
 * The labels are deliberately the short ones from the constants file. "Bright
 * indirect" is the answer; "Needs bright indirect light, away from harsh midday
 * sun" is the care guide, and it is one tab away.
 *
 * The column count follows this box, not the viewport, and that is the whole reason
 * it uses `@container`. The strip lives in the narrow buy-box column, which is 360px
 * at `lg` and 449px at `xl` — but a `lg:grid-cols-5` breakpoint only knows the
 * viewport is wide, so it laid five cells into 449px: 77px each, against a cell that
 * needs 133px for an 18px icon, a 6px gap and the widest label ("CATS AND DOGS",
 * 109px). "DIFFICULTY" cannot wrap, so it ran 23px past its cell and into the next
 * column's icon; the two labels that can wrap did, and their answers dropped a line
 * below their neighbours'. A breakpoint that cannot see the box it is styling is
 * just a guess, so the two steps are set from measured label widths rather than
 * from the viewport scale: a 3-up needs 431px of box (3 x 133px cells plus two 16px
 * gaps) and a 5-up needs 729px, and they ask for 440px and 736px so the widest label
 * keeps its own line with room to spare. The buy-box column is 449px on a desktop,
 * so that is a 3-up in practice; the 5-up is here for the day this strip is used
 * somewhere wider.
 *
 * `@container` is on the wrapper, not on the `dl`, and that is not a style choice.
 * `container-type: inline-size` makes an element a query container, but a container
 * query only ever resolves against an *ancestor* container — an element cannot
 * answer a query about itself. Tailwind compiles the two into adjacent rules, one
 * setting `container-type` on the `dl` and one wrapping the variant in
 * `@container (min-width: …)`, both landing on the same node; at a 900px box the
 * `dl` still rendered two columns. Split across a wrapper the query works, which is
 * what the numbers above were measured against.
 *
 * Nothing below can overrun a neighbouring cell at any width we ship, even in a box
 * narrower than a 3-up: the labels that wrap are the two-word ones, and the longest
 * unbreakable word ("DIFFICULTY", 76px) fits the label gutter from 216px of box
 * upwards. `items-start` then holds the icon against the first line instead of
 * letting it drift to the middle of a wrapped label.
 */
export function CareAtAGlance({
  light,
  water,
  petSafe,
  difficulty,
  heightCm,
}: {
  light: string;
  water: string;
  petSafe: boolean;
  difficulty: string;
  heightCm: number | null;
}) {
  const items = [
    {
      icon: SunIcon,
      label: "Light",
      value: label(LIGHT_LEVEL_LABELS, light),
    },
    {
      icon: DropletsIcon,
      label: "Water",
      value: label(WATER_LEVEL_LABELS, water),
    },
    {
      icon: PawPrintIcon,
      label: "Cats and dogs",
      value: petSafe ? "Non-toxic" : "Toxic if eaten",
    },
    {
      icon: GaugeIcon,
      label: "Difficulty",
      value: label(DIFFICULTY_LABELS, difficulty),
    },
    {
      icon: RulerIcon,
      label: "Mature height",
      value: heightCm === null ? "Varies" : `Up to ${Math.round(heightCm)} cm`,
    },
  ];

  return (
    // The wrapper owns `container-type` so the queries on the `dl` below resolve
    // against it. See the note at the top of this file.
    <div className="@container">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-ink/10 py-5 @min-[27.5rem]:grid-cols-3 @min-[46rem]:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="flex items-start gap-1.5 text-[0.75rem] tracking-[0.1em] text-text-muted uppercase">
              <item.icon
                aria-hidden="true"
                className="mt-px size-[1.125rem] shrink-0 text-forest"
                strokeWidth={1.75}
              />
              <span className="min-w-0">{item.label}</span>
            </dt>
            <dd className="mt-1.5 text-[0.875rem] leading-snug font-medium text-ink">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Falls back to the raw stored value when it is not one we recognise.
 *
 * The rows are validated on the way out of the data layer, so this only triggers if
 * somebody edits the database by hand — in which case showing the value is more
 * useful than hiding the row.
 */
function label<T extends string>(
  labels: Record<T, string>,
  value: string,
): string {
  return labels[value as T] ?? value;
}
