import { CheckIcon, XIcon } from "lucide-react";

import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

import { cn } from "cn";

/**
 * Where an order is, drawn as a line you can read.
 *
 * Four milestones cover every live state and a cancelled order gets its own
 * terminal node, because a cancelled order is not "stuck on confirmation". The
 * statuses the database stores are translated into a fixed progression here,
 * so the drawing can never disagree with the label in the badge next to it.
 */
const MILESTONES = [
  { status: "PENDING" as const, label: "Order placed", hint: "We have your order." },
  { status: "CONFIRMED" as const, label: "Confirmed", hint: "Your plant is being packed." },
  { status: "SHIPPED" as const, label: "On its way", hint: "Out the door with a name tag." },
  { status: "DELIVERED" as const, label: "Delivered", hint: "Find a window and a watering can." },
] as const;

type Step = {
  label: string;
  hint: string;
  state: "done" | "current" | "upcoming" | "danger";
  /** Position in the line, used to draw the connector surfaces. */
  index: number;
};

function stepsFor(status: OrderStatus): Step[] {
  if (status === "CANCELLED") {
    return [
      { ...MILESTONES[0], state: "done", index: 0 },
      {
        label: "Cancelled",
        hint: "Nothing was charged.",
        state: "danger",
        index: 1,
      },
    ];
  }

  const currentIndex = MILESTONES.findIndex((step) => step.status === status);

  return MILESTONES.map((step, index) => ({
    ...step,
    state:
      index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
    index,
  }));
}

/** Node colours. Done and current share the forest; danger is the system's red. */
const NODE_STYLES: Record<Step["state"], string> = {
  done: "border-forest bg-forest text-white",
  current: "border-forest bg-mint text-forest ring-4 ring-forest/10",
  upcoming: "border-ink/15 bg-white text-ink/40",
  danger: "border-destructive bg-destructive text-white",
};

/**
 * The progress line for one order.
 *
 * Horizontal on every size — three milestones fit comfortably on a phone when
 * the hint text steps aside (`hidden sm:block`). Two nodes plus a red one are all
 * a cancelled or refunded order ever draws, so a terminal state never pretends
 * the plant is still en route.
 */
export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  const steps = stepsFor(status);

  return (
    <div>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.label}
              className={cn("flex items-start", !isLast && "flex-1")}
            >
              <div className="flex min-w-0 flex-col items-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-[0.8125rem] leading-none font-semibold",
                    NODE_STYLES[step.state],
                  )}
                >
                  {step.state === "done" ? (
                    <CheckIcon className="size-4" strokeWidth={1.75} />
                  ) : step.state === "danger" ? (
                    <XIcon className="size-4" strokeWidth={1.75} />
                  ) : (
                    index + 1
                  )}
                </span>

                <p
                  className={cn(
                    "mt-2 text-center text-[0.8125rem] leading-snug font-medium",
                    step.state === "current"
                      ? "text-forest"
                      : step.state === "upcoming"
                        ? "text-ink/45"
                        : step.state === "danger"
                          ? "text-destructive"
                          : "text-ink/70",
                  )}
                >
                  {step.label}
                </p>

                <p className="mt-1 hidden text-[0.75rem] leading-snug text-ink/45 sm:block">
                  {step.hint}
                </p>
              </div>

              {/* Connector to the next milestone. The flex cell gives it the
                  leftover width between two fixed nodes. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative top-4 h-0.5 min-w-4 flex-1 rounded-full",
                    step.state === "done" ? "bg-forest" : "bg-ink/15",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-small text-text-muted">
        {ORDER_STATUS_LABELS[status]}
      </p>
    </div>
  );
}