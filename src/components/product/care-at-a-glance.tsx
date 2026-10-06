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
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-ink/10 py-5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[0.75rem] tracking-[0.1em] text-text-muted uppercase">
            <item.icon
              aria-hidden="true"
              className="size-[1.125rem] shrink-0 text-forest"
              strokeWidth={1.75}
            />
            {item.label}
          </dt>
          <dd className="mt-1.5 text-[0.875rem] leading-snug font-medium text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
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
