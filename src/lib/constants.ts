import { z } from "zod";

/*
  SQLite has no reliable enum support, so every small fixed-value field is
  stored as String and validated here. Import these constants everywhere instead
  of re-typing literals: the allowed values, their labels and their types all
  live in this one file, so a value can never drift between the database, a form
  and a chart.
*/

export const USER_ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  STAFF: "Staff",
  ADMIN: "Admin",
};

/**
 * The order lifecycle. A pending order can be paid or cancelled; a paid order can
 * ship or be refunded; a shipped order can still be refunded. Fulfilled and
 * refunded are terminal, and cancelled is terminal because nothing was taken.
 */
export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "REFUNDED",
] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/**
 * Allowed status changes, keyed by the status an order is leaving. Anything not
 * listed here is not a legal move. The order of the keys is the order the
 * statuses appear in the admin UI.
 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["FULFILLED", "REFUNDED"],
  FULFILLED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export const PAYMENT_METHODS = ["STRIPE", "COD"] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  STRIPE: "Card",
  COD: "Cash on delivery",
};

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

/** How much light a plant asks for. Ordered from least to most demanding. */
export const LIGHT_LEVELS = ["LOW", "MEDIUM", "BRIGHT"] as const;
export const lightLevelSchema = z.enum(LIGHT_LEVELS);
export type LightLevel = z.infer<typeof lightLevelSchema>;

export const LIGHT_LEVEL_LABELS: Record<LightLevel, string> = {
  LOW: "Low light",
  MEDIUM: "Medium light",
  BRIGHT: "Bright indirect",
};

/** How often it wants water. Roughly: LOW is weeks, HIGH is weekly. */
export const WATER_LEVELS = ["LOW", "MODERATE", "HIGH"] as const;
export const waterLevelSchema = z.enum(WATER_LEVELS);
export type WaterLevel = z.infer<typeof waterLevelSchema>;

export const WATER_LEVEL_LABELS: Record<WaterLevel, string> = {
  LOW: "Infrequent",
  MODERATE: "Every week or so",
  HIGH: "Thirsty",
};

export const DIFFICULTY_LEVELS = ["EASY", "MODERATE", "EXPERT"] as const;
export const difficultySchema = z.enum(DIFFICULTY_LEVELS);
export type Difficulty = z.infer<typeof difficultySchema>;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MODERATE: "Some attention",
  EXPERT: "Fussy",
};

export const CONTACT_TOPICS = [
  "ORDER",
  "PLANT_ADVICE",
  "DELIVERY",
  "WHOLESALE",
  "OTHER",
] as const;
export const contactTopicSchema = z.enum(CONTACT_TOPICS);
export type ContactTopic = z.infer<typeof contactTopicSchema>;

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  ORDER: "An order",
  PLANT_ADVICE: "Plant advice",
  DELIVERY: "Delivery or returns",
  WHOLESALE: "Wholesale",
  OTHER: "Something else",
};

/** Sort options offered on the shop page, in the order they appear there. */
export const PRODUCT_SORTS = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "name",
] as const;
export const productSortSchema = z.enum(PRODUCT_SORTS);
export type ProductSort = z.infer<typeof productSortSchema>;

export const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  name: "Name",
};

/** Stock at or below this is flagged as low stock in the shop UI. */
export const LOW_STOCK_THRESHOLD = 3;

export const FREE_SHIPPING_LABEL = "Free shipping";

/*
  Shipping defaults.

  These live here rather than only in the Setting row because two other places
  need to agree with them: the fallback that keeps a checkout working before the
  database has been seeded, and the seed that writes the Setting row in the first
  place. A fee that differs between those three would show one number in the cart
  and charge another.
*/
export const SHIPPING_FEE_CENTS = 795;

/** Baskets at or above this ship free. The comparison is inclusive. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
