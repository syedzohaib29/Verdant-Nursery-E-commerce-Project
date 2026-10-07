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

/**
 * The order lifecycle. An order moves PENDING → CONFIRMED → SHIPPED → DELIVERED,
 * and can be cancelled from PENDING or CONFIRMED — before it leaves the bench.
 * Cancelled is terminal because nothing was taken; delivered is terminal because
 * the plant is on the customer's shelf.
 *
 * Payment is deliberately not part of this chain: whether money has moved is
 * `paymentStatus`, a separate column. A card order can be paid and still sit at
 * PENDING until a person confirms it, and a cash-on-delivery order is only marked
 * paid when it is delivered. One lifecycle for fulfilment, one for money.
 */
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
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
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** The statuses an order can legally move to next. */
export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status];
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

/**
 * How many units one press of "Restock" adds to a shelf. A tray: big enough to
 * matter, small enough that a mis-click is not a warehouse incident. The button
 * copy, the confirmation and the server action all read this one number, so the
 * dialog can never promise twelve and add ten.
 */
export const RESTOCK_BATCH = 12;

/**
 * Cookie that remembers whether the admin sidebar is collapsed. Read on the
 * server in the admin layout so the rail renders at its saved width on the very
 * first paint, and written from the client when the toggle is pressed.
 */
export const ADMIN_NAV_COOKIE = "verdant-admin-nav";

export const SHIPPING_FEE_CENTS = 795;

/** Baskets at or above this ship free. The comparison is inclusive. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
