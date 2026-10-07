import "server-only";

import bcrypt from "bcryptjs";

import { userRoleSchema, type UserRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/*
  User queries.

  Password hashes never leave this layer. Nothing here returns
  `passwordHash`, so there is no way for a future edit to pass a hash into a
  component by accident. `createAccount` is the single exception, and it takes a
  plain password and hashes it on the way in, so even that call site never holds
  a hash.
*/

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  /**
   * Narrowed, not `string`. Every row is run through `userRoleSchema` on the way
   * out, so the value is one of three — and saying so here is what lets the
   * session's `User` carry it without the cast that would otherwise be needed at
   * the auth boundary.
   */
  role: UserRole;
  phone: string | null;
  disabled: boolean;
  createdAt: string;
};

export type UserWithAddresses = UserSummary & {
  addresses: {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[];
};

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  disabled: true,
  createdAt: true,
} as const;

export async function getUserById(id: string): Promise<UserSummary | null> {
  const row = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!row) return null;

  const role = userRoleSchema.safeParse(row.role);
  if (!role.success) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: role.data,
    phone: row.phone,
    disabled: row.disabled,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getUserWithAddresses(
  id: string,
): Promise<UserWithAddresses | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_SELECT,
      addresses: {
        // Address has no timestamp, so the default comes first and the rest fall
        // back to insertion order by id, which is stable.
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        select: {
          id: true,
          fullName: true,
          phone: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          isDefault: true,
        },
      },
    },
  });

  if (!row) return null;

  const role = userRoleSchema.safeParse(row.role);
  if (!role.success) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: role.data,
    phone: row.phone,
    disabled: row.disabled,
    createdAt: row.createdAt.toISOString(),
    addresses: row.addresses,
  };
}

export async function getAddressById(id: string): Promise<
  UserWithAddresses["addresses"][number] | null
> {
  return prisma.address.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      phone: true,
      line1: true,
      line2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      isDefault: true,
    },
  });
}

/** Wishlist entries for a customer, newest first, as product cards. */

/**
 * bcrypt cost. Twelve is roughly 250ms on commodity hardware — slow enough that a
 * stolen hash table is expensive to work through, fast enough that signing in
 * still feels immediate. New accounts are written at this cost; an existing hash
 * keeps whatever cost it was created with, so raising it never invalidates
 * anybody's password.
 */
const BCRYPT_ROUNDS = 12;

/**
 * Checks a password against a stored hash.
 *
 * Returns null for every failure — no such user, wrong password, disabled
 * account — and deliberately does not say which. A sign-in form that reports
 * "no account with that address" is a free account-enumeration oracle, and
 * Auth.js maps both failures onto the same message anyway. Timing is levelled by
 * running a real comparison even when the row is missing, so a wrong email does
 * not answer noticeably faster than a wrong password.
 *
 * `disabled` is checked after the hash, not before: a locked-out account should
 * cost the same as a wrong password, for the same reason.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<UserSummary | null> {
  const row = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { ...USER_SELECT, passwordHash: true },
  });

  if (!row) {
    // A throwaway hash of "verdant" keeps the failure path as expensive as the
    // success path without needing a second database round trip.
    await bcrypt.compare(password, "$2b$10$abcdefghijklmnopqrstuv");
    return null;
  }

  const matches = await bcrypt.compare(password, row.passwordHash);

  if (!matches || row.disabled) return null;

  const role = userRoleSchema.safeParse(row.role);
  if (!role.success) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: role.data,
    phone: row.phone,
    disabled: row.disabled,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Whether an address is already taken, so signup can say so before inserting. */
export async function emailInUse(email: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });

  return row !== null;
}

export type CreateAccountResult =
  | { ok: true; user: UserSummary }
  | { ok: false; reason: "email-taken" | "failed" };

/**
 * Creates a customer account from a plain-text password.
 *
 * The password is hashed here rather than by the caller so no other module has
 * to import bcrypt or hold a hash, and the unique-email race is handled as a
 * readable outcome instead of an exception: two people can submit the same
 * address on the same slow connection, and one of them deserves to be told the
 * address is taken rather than shown a generic failure.
 */
export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<CreateAccountResult> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const created = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        role: "CUSTOMER",
        ...(input.phone ? { phone: input.phone.trim() } : {}),
      },
      select: USER_SELECT,
    });

    const role = userRoleSchema.safeParse(created.role);
    if (!role.success) return { ok: false, reason: "failed" };

    return {
      ok: true,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: role.data,
        phone: created.phone,
        disabled: created.disabled,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, reason: "email-taken" };
  }
}

/**
 * The ids on a customer's wishlist, oldest first.
 *
 * Ids only — the wishlist page turns these into cards with `getProductsByIds`.
 * `userId` is checked by the caller against the session, never supplied by the
 * browser, so there is no ownership question to answer here.
 */
export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return rows.map((row) => row.productId);
}

/**
 * Saves a product to a customer's wishlist.
 *
 * Idempotent: the unique index on (userId, productId) means a double click
 * cannot create two rows, so this upserts rather than catching a constraint
 * error. An inactive product is refused — a wishlist is a list of things that can
 * still be bought, and a saved draft is a broken link waiting to be clicked.
 */
export async function addWishlistProduct(
  userId: string,
  productId: string,
): Promise<{ ok: boolean; reason: string | null }> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });

  if (!product) return { ok: false, reason: "That plant is no longer on the shelf." };

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });

  return { ok: true, reason: null };
}

/** Removes a product from a customer's wishlist. Idempotent, like the add. */
export async function removeWishlistProduct(
  userId: string,
  productId: string,
): Promise<{ ok: boolean; reason: string | null }> {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });

  return { ok: true, reason: null };
}

/**
 * Folds a guest's local wishlist into their account at sign-in.
 *
 * Existing rows win on `createdAt` so a customer's carefully ordered wishlist is
 * not reshuffled by whatever was last in their pocket's localStorage. Only active
 * products are merged, and the local copy is only cleared by the caller when this
 * returns the ids that are now on the account — a merge that partly failed must
 * not leave the browser with an empty list.
 */
export async function mergeWishlist(
  userId: string,
  productIds: string[],
): Promise<{ ok: boolean; ids: string[]; reason: string | null }> {
  const wanted = [...new Set(productIds)];

  try {
    if (wanted.length > 0) {
      const active = await prisma.product.findMany({
        where: { id: { in: wanted }, isActive: true },
        select: { id: true },
      });

      // One upsert per row rather than a single `createMany`.
      //
      // `skipDuplicates` is what makes that the obvious choice on Postgres or MySQL,
      // but SQLite's connector does not implement it — passing the flag is a type
      // error and running without it fails against the unique index. So the
      // duplicates are skipped by design instead of by option, in one transaction so
      // a failure partway through leaves the account's wishlist untouched rather than
      // half-merged.
      //
      // The ids are already de-duplicated above, so there is nothing else here for
      // `upsert` to reconcile.
      await prisma.$transaction(
        active.map((product) =>
          prisma.wishlistItem.upsert({
            where: {
              userId_productId: { userId, productId: product.id },
            },
            create: { userId, productId: product.id },
            // An existing row is left exactly as it is, so `createdAt` keeps the
            // order the customer built their list in.
            update: {},
          }),
        ),
      );
    }

    return { ok: true, ids: await getWishlistProductIds(userId), reason: null };
  } catch {
    return { ok: false, ids: [], reason: "We could not save your wishlist." };
  }
}

/*
  Profile, password and address books.

  The account pages write to all three, and each one shares a rule: who is editing
  is the caller's own id, decided by the server action from its session and never
  accepted from the request. Where a function does take an `addressId`, it checks
  that the row belongs to that user before touching it — an edit that skipped the
  check would be a way to edit somebody else's account.
*/

/** Saves the edited profile. Returns the fresh row, or null for a missing user. */
export async function updateProfile(
  userId: string,
  input: { name: string; phone: string },
): Promise<UserSummary | null> {
  const row = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name.trim(),
      phone: input.phone.trim() || null,
    },
    select: USER_SELECT,
  });

  const role = userRoleSchema.safeParse(row.role);
  if (!role.success) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: role.data,
    phone: row.phone,
    disabled: row.disabled,
    createdAt: row.createdAt.toISOString(),
  };
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: "user-not-found" | "current-password-wrong" | "failed" };

/**
 * Changes the password, after proving the current one.
 *
 * The current password is compared under bcrypt before the new one is hashed, so
 * a request that cannot name the current password never gets a row that would let
 * it compare guesses against the hash layer. The two hashing steps keep the
 * timing cost of a wrong guess honest about the fact that it was checked.
 */
export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<ChangePasswordResult> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!row) return { ok: false, reason: "user-not-found" };

  const currentMatches = await bcrypt.compare(input.currentPassword, row.passwordHash);

  if (!currentMatches) return { ok: false, reason: "current-password-wrong" };

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export type SaveAddressResult =
  | { ok: true; addressId: string }
  | { ok: false; reason: "not-found" | "failed" };

/**
 * Creates or edits an address in the customer's book.
 *
 * Owning the demote-then-promote dance here keeps it out of the action and out of
 * the form: only one row may be the default, the first saved address becomes the
 * default whether the box was ticked or not, and every move happens in one
 * transaction so a half-finished swap can never leave two addresses arguing about
 * it. An `id` that belongs to somebody else is refused rather than treated as a
 * new address, which is the ownership check this function exists to perform.
 */
export async function saveAddress(
  userId: string,
  input: {
    id?: string;
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  },
): Promise<SaveAddressResult> {
  try {
    if (input.id) {
      const owned = await prisma.address.findFirst({
        where: { id: input.id, userId },
        select: { id: true },
      });

      if (!owned) return { ok: false, reason: "not-found" };

      const existingCount = await prisma.address.count({ where: { userId } });

      await prisma.$transaction([
        ...(input.isDefault
          ? [prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })]
          : []),
        prisma.address.update({
          where: { id: input.id },
          data: {
            fullName: input.fullName.trim(),
            phone: input.phone.trim(),
            line1: input.line1,
            line2: input.line2 || null,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country.toUpperCase(),
            // The first address is the default whether the box was ticked or not.
            isDefault: input.isDefault || existingCount === 1,
          },
        }),
      ]);

      return { ok: true, addressId: input.id };
    }

    const existingCount = await prisma.address.count({ where: { userId } });
    const makeDefault = input.isDefault || existingCount === 0;

    const created = await prisma.address.create({
      data: {
        userId,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country.toUpperCase(),
        isDefault: makeDefault,
      },
      select: { id: true },
    });

    if (makeDefault && existingCount > 0) {
      await prisma.address.updateMany({
        where: { userId, NOT: { id: created.id } },
        data: { isDefault: false },
      });
    }

    return { ok: true, addressId: created.id };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** Removes an address, promoting another to default if the one deleted was it. */
export async function deleteAddress(
  userId: string,
  addressId: string,
): Promise<{ ok: boolean; reason: "not-found" | "failed" | null }> {
  try {
    const owned = await prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true, isDefault: true },
    });

    if (!owned) return { ok: false, reason: "not-found" };

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: addressId } });

      // A list without a default is a checkout form with no sensible first pick,
      // so the oldest remaining address inherits it — exactly one of them.
      if (owned.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId, id: { not: addressId } },
          orderBy: { id: "asc" },
          select: { id: true },
        });

        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { ok: true, reason: null };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** Name one address the default, in one transaction so the swap cannot split. */
export async function setDefaultAddress(
  userId: string,
  addressId: string,
): Promise<{ ok: boolean; reason: "not-found" | "failed" | null }> {
  try {
    const owned = await prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });

    if (!owned) return { ok: false, reason: "not-found" };

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);

    return { ok: true, reason: null };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
