import { describe, expect, it } from "vitest";

import {
  canTransitionOrder,
  nextStatuses,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/constants";

describe("order status transitions", () => {
  it("walks the happy path PENDING → CONFIRMED → SHIPPED → DELIVERED", () => {
    expect(canTransitionOrder("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("lets PENDING and CONFIRMED orders be cancelled", () => {
    expect(canTransitionOrder("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("CONFIRMED", "CANCELLED")).toBe(true);
  });

  it("refuses jumps and reversals", () => {
    expect(canTransitionOrder("PENDING", "SHIPPED")).toBe(false);
    expect(canTransitionOrder("CONFIRMED", "DELIVERED")).toBe(false);
    expect(canTransitionOrder("SHIPPED", "CANCELLED")).toBe(false);
  });

  it("treats DELIVERED and CANCELLED as terminal", () => {
    for (const status of ["DELIVERED", "CANCELLED"] as const) {
      expect(ORDER_STATUS_TRANSITIONS[status]).toEqual([]);
      expect(nextStatuses(status)).toEqual([]);
    }
  });

  it("never allows a status to move to itself", () => {
    for (const status of Object.keys(ORDER_STATUS_TRANSITIONS) as Array<
      keyof typeof ORDER_STATUS_TRANSITIONS
    >) {
      expect(canTransitionOrder(status, status)).toBe(false);
    }
  });

  it("holds the full transition table", () => {
    expect(ORDER_STATUS_TRANSITIONS.PENDING).toEqual([
      "CONFIRMED",
      "CANCELLED",
    ]);
    expect(ORDER_STATUS_TRANSITIONS.CONFIRMED).toEqual([
      "SHIPPED",
      "CANCELLED",
    ]);
    expect(ORDER_STATUS_TRANSITIONS.SHIPPED).toEqual(["DELIVERED"]);
  });
});