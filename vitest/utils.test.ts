import { describe, expect, it } from "vitest";

import {
  clamp,
  formatDate,
  formatPrice,
  generateOrderNumber,
  slugify,
} from "@/lib/utils";

describe("formatPrice", () => {
  it("formats dollars and cents from integer cents", () => {
    expect(formatPrice(2650)).toBe("$26.50");
    expect(formatPrice(795)).toBe("$7.95");
  });

  it("drops the trailing zeros when the amount is whole", () => {
    expect(formatPrice(2600)).toBe("$26");
    expect(formatPrice(0)).toBe("$0");
  });

  it("groups thousands", () => {
    expect(formatPrice(1234567)).toBe("$12,345.67");
  });

  it("always rounds half cents down to whole cents on display", () => {
    expect(formatPrice(2505)).toBe("$25.05");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Monstera Deliciosa")).toBe("monstera-deliciosa");
  });

  it("is case-insensitive so one plant gets one URL", () => {
    expect(slugify("Monstera Deliciosa")).toBe(slugify("monstera deliciosa"));
  });

  it("folds accented letters instead of dropping them", () => {
    expect(slugify("Café au Lait")).toBe("cafe-au-lait");
    expect(slugify("Nähe")).toBe("nahe");
  });

  it("removes apostrophes and stray punctuation", () => {
    expect(slugify("O'Connor")).toBe("oconnor");
    expect(slugify("PLANT! & Pot")).toBe("plant-pot");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --ZZ Plant--  ")).toBe("zz-plant");
  });
});

describe("generateOrderNumber", () => {
  it("pads the sequence to five digits", () => {
    expect(generateOrderNumber(1)).toBe("VRD-00001");
    expect(generateOrderNumber(999)).toBe("VRD-00999");
  });

  it("does not truncate beyond five digits", () => {
    expect(generateOrderNumber(12345)).toBe("VRD-12345");
    expect(generateOrderNumber(100001)).toBe("VRD-100001");
  });
});

describe("clamp", () => {
  it("clamps into the range", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 99)).toBe(0);
    expect(clamp(50, 0, 39)).toBe(39);
  });

  it("passes values already inside the range through", () => {
    expect(clamp(7, 0, 10)).toBe(7);
  });
});

describe("formatDate", () => {
  it("formats a date as Month Day, Year", () => {
    expect(formatDate(new Date(2026, 9, 7))).toBe("Oct 7, 2026");
  });

  it("adds the time when asked", () => {
    expect(formatDate(new Date(2026, 9, 7, 14, 5), true)).toBe(
      "Oct 7, 2026, 2:05 PM",
    );
  });
});