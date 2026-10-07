import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/lib/validations/auth";
import {
  applyPromoSchema,
  checkoutFormSchema,
  createOrderSchema,
  updateCartLineSchema,
} from "@/lib/validations/checkout";
import { contactMessageSchema } from "@/lib/validations/contact";
import { reviewSchema } from "@/lib/validations/review";
import { ratingSchema } from "@/lib/validations/shared";

const validShipping = {
  fullName: "Alex Rivera",
  phone: "(503) 555-0148",
  line1: "12 Kiln Lane",
  line2: "",
  city: "Portland",
  state: "OR",
  postalCode: "97209",
  country: "US",
};

/** A cuid-shaped id that passes z.string().cuid(): c + lowercase alphanumerics. */
const CUID = "clvx3example0000p0000abcde";

describe("loginSchema", () => {
  it("accepts a valid sign-in", () => {
    expect(
      loginSchema.safeParse({ email: "mara@example.com", password: "x".repeat(8) })
        .success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("requires a password", () => {
    const result = loginSchema.safeParse({ email: "mara@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires matching passwords", () => {
    const result = registerSchema.safeParse({
      name: "Mara Quinn",
      email: "mara@example.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Those passwords do not match.");
  });

  it("accepts a matching pair", () => {
    expect(
      registerSchema.safeParse({
        name: "Mara Quinn",
        email: "mara@example.com",
        password: "password1",
        confirmPassword: "password1",
      }).success,
    ).toBe(true);
  });

  it("enforces the password floor", () => {
    const result = registerSchema.safeParse({
      name: "Mara Quinn",
      email: "mara@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("8");
  });
});

describe("checkoutFormSchema", () => {
  it("accepts a fully filled checkout", () => {
    expect(
      checkoutFormSchema.safeParse({
        ...validShipping,
        email: "mara@example.com",
        paymentMethod: "COD",
      }).success,
    ).toBe(true);
  });

  it("rejects a missing email", () => {
    const result = checkoutFormSchema.safeParse({
      ...validShipping,
      email: "",
      paymentMethod: "COD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a bogus payment method", () => {
    const result = checkoutFormSchema.safeParse({
      ...validShipping,
      email: "mara@example.com",
      paymentMethod: "BITCOIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  it("accepts a real order payload", () => {
    expect(
      createOrderSchema.safeParse({
        email: "mara@example.com",
        paymentMethod: "COD",
        promoCode: "",
        saveAddress: false,
        checkoutToken: "tok-12345678",
        shipping: validShipping,
        lines: [{ productId: CUID, quantity: 2 }],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty basket", () => {
    const result = createOrderSchema.safeParse({
      email: "mara@example.com",
      paymentMethod: "COD",
      promoCode: "",
      saveAddress: false,
      checkoutToken: "tok-12345678",
      shipping: validShipping,
      lines: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Your basket is empty.");
  });

  it("rejects an overfull basket", () => {
    const result = createOrderSchema.safeParse({
      email: "mara@example.com",
      paymentMethod: "COD",
      promoCode: "",
      saveAddress: false,
      checkoutToken: "tok-12345678",
      shipping: validShipping,
      lines: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41].map((n) => ({
        productId: `clvx3example0000p0000abcde${n}`,
        quantity: 1,
      })),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCartLineSchema", () => {
  it("coerces a string quantity", () => {
    const result = updateCartLineSchema.parse({
      productId: CUID,
      quantity: "4",
    });
    expect(result.quantity).toBe(4);
  });

  it("zero removes the line", () => {
    expect(
      updateCartLineSchema.safeParse({ productId: CUID, quantity: 0 })
        .success,
    ).toBe(true);
  });

  it("rejects fractional and oversized quantities", () => {
    expect(
      updateCartLineSchema.safeParse({ productId: CUID, quantity: 2.5 })
        .success,
    ).toBe(false);
    expect(
      updateCartLineSchema.safeParse({ productId: CUID, quantity: 100 })
        .success,
    ).toBe(false);
  });
});

describe("applyPromoSchema", () => {
  it("requires at least three characters", () => {
    const result = applyPromoSchema.safeParse({ code: "ab" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter the code you were given.");
  });

  it("trims surrounding whitespace", () => {
    const result = applyPromoSchema.safeParse({ code: "  PLANT10  " });
    if (!result.success) throw new Error("expected a valid parse");
    expect(result.data.code).toBe("PLANT10");
  });
});

describe("contactMessageSchema", () => {
  it("accepts a proper message", () => {
    expect(
      contactMessageSchema.safeParse({
        name: "Mara Quinn",
        email: "mara@example.com",
        topic: "a-plant-question",
        message: "My fern is unhappy and I do not know why.",
        website: "",
      }).success,
    ).toBe(true);
  });

  it("rejects a two-word message", () => {
    const result = contactMessageSchema.safeParse({
      name: "Mara Quinn",
      email: "mara@example.com",
      topic: "a-plant-question",
      message: "Help!",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Give us a sentence or two.",
    );
  });
});

describe("reviewSchema", () => {
  it("accepts a full review", () => {
    expect(
      reviewSchema.safeParse({
        productId: CUID,
        rating: 4,
        title: "Thriving after a month",
        body: "It put out two new leaves within a fortnight.",
      }).success,
    ).toBe(true);
  });

  it("rejects a rating of zero", () => {
    expect(ratingSchema.safeParse(0).success).toBe(false);
    expect(ratingSchema.safeParse(6).success).toBe(false);
  });
});