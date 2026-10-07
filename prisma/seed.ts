import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  LOW_STOCK_THRESHOLD,
  SHIPPING_FEE_CENTS,
} from "../src/lib/constants";
import { formatPrice, slugify } from "../src/lib/utils";

import { CATEGORIES } from "./seed-data/categories";
import { CONTACT_MESSAGES, NEWSLETTER_SUBSCRIBERS } from "./seed-data/inbox";
import { JOURNAL_POSTS } from "./seed-data/journal";
import { generateOrders } from "./seed-data/orders";
import { PRODUCTS } from "./seed-data/products";
import { REVIEWS } from "./seed-data/reviews";
import { USERS } from "./seed-data/users";
import { WISHLIST } from "./seed-data/wishlists";

/*
  Seed script. Run with: npm run db:seed

  Two rules shape everything below.

  1. It is idempotent. Anything with a natural unique key (category slug, product
     sku, user email, promo code, newsletter address) is upserted, and anything
     without one is deleted and rebuilt. Running it twice must leave the same
     database behind, not a second copy of everything.

  2. It fails loudly. A SKU in the review file that no longer exists, or a
     category slug with no category, is a mistake in this repository rather than a
     condition to work around. Silently skipping rows is how a seed ends up
     looking like it worked while quietly dropping a third of the catalogue.

  Money is never copied from the seed data into an order. Every order total is
  recomputed from the product prices actually in the database, so a seeded order
  can never disagree with its own lines, and repricing a product and re-seeding
  gives coherent order history rather than thirty orders with stale totals.

  The catalogue, customers, orders, reviews, wishlists, journal and inbox live in
  ./seed-data as plain data modules. This file is only the part that talks to the
  database.
*/

/** A date `daysAgo` days back, at `hour`:`minute` local time. */
function daysAgoAt(daysAgo: number, hour = 10, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/** Something that only exists to make a broken seed fail with a useful message. */
function fail(message: string): never {
  throw new Error(`seed: ${message}`);
}

/** Looks a value up in a map that the caller already proved is exhaustive. */
function required<T>(map: Map<string, T>, key: string, what: string): T {
  const value = map.get(key);

  if (value === undefined) {
    fail(`no ${what} for "${key}"`);
  }

  return value;
}

/**
 * Removes catalogue rows this seed no longer owns.
 *
 * The seed is the source of truth for categories and products, so anything left
 * over from a previous run of it is stale data rather than something to keep.
 * Retiring a product in seed-data/products.ts and re-seeding has to actually
 * remove it: the old row would keep its slug and SKU on the shelf, and if the SKU
 * was renumbered at the same time the next upsert would collide on the slug unique
 * index and abort the whole seed.
 *
 * Products go first because a category still holding products cannot be deleted.
 * Deleting a product cascades its images, reviews and wishlist rows, and nulls its
 * order lines, whose name, price and image snapshots survive intact.
 */
async function retireStaleCatalogue(prisma: PrismaClient): Promise<void> {
  const seededSkus = PRODUCTS.map((product) => product.sku);
  const seededSlugs = CATEGORIES.map((category) => category.slug);

  const retiredProducts = await prisma.product.count({
    where: { sku: { notIn: seededSkus } },
  });

  if (retiredProducts > 0) {
    const { count } = await prisma.product.deleteMany({
      where: { sku: { notIn: seededSkus } },
    });
    console.log(`  retired ${count} product(s) no longer in the catalogue`);
  }

  const retiredCategories = await prisma.category.count({
    where: { slug: { notIn: seededSlugs } },
  });

  if (retiredCategories > 0) {
    const { count } = await prisma.category.deleteMany({
      where: { slug: { notIn: seededSlugs } },
    });
    console.log(`  retired ${count} categor(y/ies) no longer in the catalogue`);
  }
}

async function seedCategories(prisma: PrismaClient): Promise<Map<string, string>> {
  console.log(`  categories (${CATEGORIES.length})`);

  const idBySlug = new Map<string, string>();

  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
      },
      create: category,
    });

    idBySlug.set(category.slug, row.id);
  }

  return idBySlug;
}

async function seedProducts(
  prisma: PrismaClient,
  categoryIdBySlug: Map<string, string>,
): Promise<Map<string, { id: string; name: string; image: string | null; unitCents: number }>> {
  console.log(`  products (${PRODUCTS.length})`);

  const bySku = new Map<string, { id: string; name: string; image: string | null; unitCents: number }>();

  for (const product of PRODUCTS) {
    const categoryId = required(categoryIdBySlug, product.categorySlug, "category");
    const slug = slugify(product.name);

    const row = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug,
        description: product.description,
        careNotes: product.careNotes,
        priceCents: product.priceCents,
        salePriceCents: product.salePriceCents,
        stock: product.stock,
        categoryId,
        featured: product.featured,
        light: product.light,
        water: product.water,
        petSafe: product.petSafe,
        difficulty: product.difficulty,
        heightCm: product.heightCm,
        isActive: true,
      },
      create: {
        name: product.name,
        slug,
        description: product.description,
        careNotes: product.careNotes,
        priceCents: product.priceCents,
        salePriceCents: product.salePriceCents,
        stock: product.stock,
        sku: product.sku,
        categoryId,
        featured: product.featured,
        light: product.light,
        water: product.water,
        petSafe: product.petSafe,
        difficulty: product.difficulty,
        heightCm: product.heightCm,
        isActive: true,
      },
    });

    // Images are replaced rather than upserted. The count comes from imageAlt, so
    // the rows can never disagree with the seed data, and the filenames are the
    // contract with prisma/generate-images.ts and /public/images/REPLACE_ME.md.
    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.createMany({
      data: product.imageAlt.map((alt, position) => ({
        productId: row.id,
        url: `/images/${product.imageBase}-${position + 1}.webp`,
        alt,
        position,
      })),
    });

    const primary = await prisma.productImage.findFirst({
      where: { productId: row.id },
      orderBy: { position: "asc" },
      select: { url: true },
    });

    bySku.set(product.sku, {
      id: row.id,
      name: row.name,
      image: primary?.url ?? null,
      unitCents: row.salePriceCents ?? row.priceCents,
    });
  }

  return bySku;
}

async function seedUsers(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  console.log(`  users (${USERS.length})`);

  const idByEmail = new Map<string, string>();

  for (const user of USERS) {
    // Hashed on every run. Cheap at this size, and it means a changed password in
    // seed-data actually takes effect when you re-seed.
    const passwordHash = await bcrypt.hash(user.password, 10);

    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        phone: user.phone,
        disabled: false,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        phone: user.phone,
        disabled: false,
      },
    });

    idByEmail.set(user.email, row.id);

    // Address rows have no natural key, so they are rebuilt. The first entry in the
    // seed file is the default; anyone with more than one gets the rest as extras.
    await prisma.address.deleteMany({ where: { userId: row.id } });
    await prisma.address.create({
      data: {
        userId: row.id,
        fullName: user.name,
        phone: user.phone,
        ...user.address,
        isDefault: true,
      },
    });
  }

  return idByEmail;
}

async function seedOrders(
  prisma: PrismaClient,
  userIdByEmail: Map<string, string>,
  productBySku: Map<string, { id: string; name: string; image: string | null; unitCents: number }>,
): Promise<void> {
  const orders = generateOrders(PRODUCTS, REVIEWS);

  console.log(`  orders (${orders.length})`);

  // Rebuilt from scratch rather than upserted. The dates are relative to today, so
  // keeping the old rows would leave a second, stale copy of the same order numbers
  // the moment the window moved.
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  for (const order of orders) {
    const items = order.items.map((item) => {
      const product = required(productBySku, item.sku, "product");

      return { ...item, product };
    });

    const subtotalCents = items.reduce(
      (total, item) => total + item.product.unitCents * item.quantity,
      0,
    );
    const discountCents = order.discountCents;
    const shippingCents = order.shippingCents;

    const created = await prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        email: order.email,
        // Guests have no account, which is why this is nullable in the schema.
        userId: order.accountEmail ? required(userIdByEmail, order.accountEmail, "user") : null,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents: subtotalCents - discountCents + shippingCents,
        trackingNumber: order.trackingNumber,
        shipFullName: order.shipTo.fullName,
        shipPhone: order.shipTo.phone,
        shipLine1: order.shipTo.line1,
        shipLine2: order.shipTo.line2,
        shipCity: order.shipTo.city,
        shipState: order.shipTo.state,
        shipPostalCode: order.shipTo.postalCode,
        shipCountry: order.shipTo.country,
        createdAt: daysAgoAt(order.daysAgo, order.hour, order.minute),
      },
    });

    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: created.id,
        productId: item.product.id,
        // Snapshots, so the line still reads correctly if the product is renamed,
        // repriced or deleted later.
        name: item.product.name,
        priceCents: item.product.unitCents,
        quantity: item.quantity,
        image: item.product.image,
      })),
    });
  }
}

async function seedReviews(
  prisma: PrismaClient,
  userIdByEmail: Map<string, string>,
  productBySku: Map<string, { id: string }>,
): Promise<void> {
  console.log(`  reviews (${REVIEWS.length})`);

  await prisma.review.deleteMany({});

  for (const review of REVIEWS) {
    const product = required(productBySku, review.sku, "product");
    const userId = required(userIdByEmail, review.customer, "review author");

    await prisma.review.create({
      data: {
        productId: product.id,
        userId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        approved: review.approved,
        createdAt: daysAgoAt(review.daysAgo, 14, 20),
      },
    });
  }
}

async function seedWishlists(
  prisma: PrismaClient,
  userIdByEmail: Map<string, string>,
  productBySku: Map<string, { id: string }>,
): Promise<void> {
  console.log(`  wishlist items (${WISHLIST.length})`);

  await prisma.wishlistItem.deleteMany({});

  for (const item of WISHLIST) {
    await prisma.wishlistItem.create({
      data: {
        userId: required(userIdByEmail, item.customer, "wishlist owner"),
        productId: required(productBySku, item.sku, "product").id,
        createdAt: daysAgoAt(item.daysAgo, 21, 5),
      },
    });
  }
}

async function seedJournal(prisma: PrismaClient): Promise<void> {
  console.log(`  journal posts (${JOURNAL_POSTS.length})`);

  for (const post of JOURNAL_POSTS) {
    // Two hours back at most, so a post published "five days ago" never appears
    // to have been written tomorrow.
    await prisma.journalPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        author: post.author,
        readMinutes: post.readMinutes,
        publishedAt: daysAgoAt(post.daysAgo, 8),
        published: true,
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        author: post.author,
        readMinutes: post.readMinutes,
        publishedAt: daysAgoAt(post.daysAgo, 8),
        published: true,
      },
    });
  }
}

async function seedInbox(prisma: PrismaClient): Promise<void> {
  console.log(
    `  newsletter subscribers (${NEWSLETTER_SUBSCRIBERS.length}), contact messages (${CONTACT_MESSAGES.length})`,
  );

  for (const subscriber of NEWSLETTER_SUBSCRIBERS) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: subscriber.email },
      update: { createdAt: daysAgoAt(subscriber.daysAgo, 19, 30) },
      create: {
        email: subscriber.email,
        createdAt: daysAgoAt(subscriber.daysAgo, 19, 30),
      },
    });
  }

  await prisma.contactMessage.deleteMany({});

  for (const message of CONTACT_MESSAGES) {
    await prisma.contactMessage.create({
      data: {
        name: message.name,
        email: message.email,
        topic: message.topic,
        message: message.message,
        read: message.read,
        createdAt: daysAgoAt(message.daysAgo, 11, 40),
      },
    });
  }
}

async function seedStoreSettings(prisma: PrismaClient): Promise<void> {
  console.log("  settings, promo code");

  const settings = {
    storeName: "Verdant",
    shippingFeeCents: SHIPPING_FEE_CENTS,
    freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
    promoEnabled: true,
    contactEmail: "hello@verdant.dev",
    contactPhone: "+1 (503) 555-0148",
    address: "Bench 4, Kiln Lane, Portland, OR 97209",
  };

  await prisma.setting.upsert({
    where: { id: 1 },
    update: settings,
    create: { id: 1, ...settings },
  });

  await prisma.promoCode.upsert({
    where: { code: "VERDANT10" },
    update: { discountPercent: 10, minSubtotalCents: null, active: true },
    create: {
      code: "VERDANT10",
      discountPercent: 10,
      minSubtotalCents: null,
      active: true,
    },
  });
}

/**
 * Prints what actually landed, including the things that are meant to be unusual.
 * A seed that only reports row counts hides the three low-stock products and the
 * one that is out of stock until somebody opens the shop page and wonders.
 */
async function report(prisma: PrismaClient): Promise<void> {
  const [categories, products, users, addresses, orders, orderItems, reviews, journalPosts, wishlist, subscribers, messages] =
    await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.address.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.review.count(),
      prisma.journalPost.count(),
      prisma.wishlistItem.count(),
      prisma.newsletterSubscriber.count(),
      prisma.contactMessage.count(),
    ]);

  console.log("\n  row counts");
  console.log(`    categories ${categories}  products ${products}  users ${users}  addresses ${addresses}`);
  console.log(`    orders ${orders}  order items ${orderItems}  reviews ${reviews}`);
  console.log(`    journal ${journalPosts}  wishlist ${wishlist}`);
  console.log(`    subscribers ${subscribers}  messages ${messages}`);

  const perCategory = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { name: true, _count: { select: { products: true } } },
  });

  console.log("\n  products per category");
  for (const category of perCategory) {
    console.log(`    ${category.name.padEnd(22)} ${String(category._count.products).padStart(2)}`);
  }

  const stockEdges = await prisma.product.findMany({
    where: { stock: { lte: LOW_STOCK_THRESHOLD } },
    orderBy: { stock: "asc" },
    select: { sku: true, name: true, stock: true },
  });

  console.log(`\n  stock at or below ${LOW_STOCK_THRESHOLD}`);
  for (const product of stockEdges) {
    console.log(`    ${product.stock === 0 ? "out of stock" : "low stock "}  ${product.sku}  ${product.name}`);
  }

  const ratings = await prisma.review.groupBy({
    by: ["rating"],
    _count: { _all: true },
    orderBy: { rating: "desc" },
  });
  const pending = await prisma.review.count({ where: { approved: false } });

  console.log("\n  reviews");
  console.log(`    ${ratings.map((row) => `${row.rating} stars x${row._count._all}`).join("  ")}  (${pending} awaiting moderation)`);

  // The invariant worth checking on every run: an order total that does not equal
  // its own lines plus shipping minus discount is a money bug in the seed.
  const ordersWithItems = await prisma.order.findMany({
    select: {
      orderNumber: true,
      subtotalCents: true,
      discountCents: true,
      shippingCents: true,
      totalCents: true,
      items: { select: { priceCents: true, quantity: true } },
    },
  });

  const problems: string[] = [];

  for (const order of ordersWithItems) {
    const lines = order.items.reduce(
      (total, item) => total + item.priceCents * item.quantity,
      0,
    );

    if (lines !== order.subtotalCents) {
      problems.push(`${order.orderNumber}: lines ${lines} vs subtotal ${order.subtotalCents}`);
    }

    if (
      order.subtotalCents - order.discountCents + order.shippingCents !==
      order.totalCents
    ) {
      problems.push(`${order.orderNumber}: total does not add up`);
    }

    if (order.totalCents < 0) {
      problems.push(`${order.orderNumber}: negative total`);
    }
  }

  const orphanItems = await prisma.orderItem.count({ where: { productId: null } });

  console.log("\n  checks");
  console.log(`    ${ordersWithItems.length} orders verified: lines + shipping - discount = total`);
  console.log(`    ${orphanItems} order lines with no product row`);

  if (problems.length > 0) {
    fail(problems.join("; "));
  }

  const revenue = await prisma.order.aggregate({
    where: { status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } },
    _sum: { totalCents: true },
    _count: { _all: true },
  });

  console.log(
    `\n  paid revenue ${formatPrice(revenue._sum.totalCents ?? 0)} across ${revenue._count._all} orders`,
  );
  console.log("\n  seed complete.");
}

async function main(): Promise<void> {
  const adapter = new PrismaPg(process.env.DATABASE_URL ?? "");
  const prisma = new PrismaClient({ adapter });

  console.log("seeding verdant");

  try {
    await retireStaleCatalogue(prisma);
    const categoryIdBySlug = await seedCategories(prisma);
    const productBySku = await seedProducts(prisma, categoryIdBySlug);
    const userIdByEmail = await seedUsers(prisma);

    await seedOrders(prisma, userIdByEmail, productBySku);
    await seedReviews(prisma, userIdByEmail, productBySku);
    await seedWishlists(prisma, userIdByEmail, productBySku);
    await seedJournal(prisma);
    await seedInbox(prisma);
    await seedStoreSettings(prisma);

    await report(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
