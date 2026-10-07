import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Settings",
};

/**
 * The store settings.
 *
 * Grouped into three sections — store info, shipping, and promotions — each
 * with its own save button, because the person changing the shipping fee is
 * not usually the person changing the store name. Changes appear on the
 * storefront immediately.
 */
export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Store"
        title="Settings"
        description="The numbers the shop runs by. Changes appear on the storefront immediately."
      />

      <SettingsForm settings={settings} />
    </div>
  );
}
