import "server-only";

import { SETTINGS_ID, getSettings, type Settings } from "@/lib/data/settings";
import { prisma } from "@/lib/prisma";

/*
  Admin settings writes.

  The settings row is read all over the shop — the cart, the checkout, the
  product page — through `getSettings` in /settings.ts, which is never cached
  because a stale shipping fee is a money bug. Writing it is the one thing this
  module does, and it does it in one place so the row can never be updated
  without going through the admin.
 */

export type SettingsUpdate = {
  storeName: string;
  shippingFeeCents: number;
  freeShippingThresholdCents: number;
  promoEnabled: boolean;
  contactEmail: string;
  contactPhone: string;
  address: string;
};

/**
 * Replaces the settings row.
 *
 * The row is created if it is missing rather than assumed to exist: a database
 * that has never been seeded still has to be configurable, and an upsert
 * against a pinned id is one query instead of a read-then-write race.
 *
 * The returned settings come from `getSettings` rather than from the row just
 * written, so the labels are computed by the same code path as every other
 * reader — one formatter, one opinion about what a price looks like.
 */
export async function updateSettings(
  input: SettingsUpdate,
): Promise<Settings> {
  await prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  });

  return getSettings();
}
