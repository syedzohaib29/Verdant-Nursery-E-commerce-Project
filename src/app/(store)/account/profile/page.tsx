import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserById } from "@/lib/data/users";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Profile",
};

/**
 * Profile — two forms, one page.
 *
 * The email sits above the editable row as a read-only fact because changing it
 * is a deliberate act the shop does not let you speed through; the name and
 * phone are the fields a plant order actually gets addressed to.
 */
export default async function AccountProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl("/account"))}`);
  }

  return (
    <div>
      <p className="eyebrow">Profile</p>
      <h1 className="mt-3 text-h2 text-ink">Your details.</h1>
      <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink/60">
        What the receipts and the boxes should say.
      </p>

      <div className="mt-8 max-w-xl">
        <section className="rounded-xl border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Profile details
          </h2>

          <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-[0.9375rem] text-ink/70">Email</span>
              <span className="truncate text-[0.9375rem] font-medium text-ink">
                {user.email}
              </span>
            </div>
            <p className="flex items-center gap-2 py-3 text-small text-text-muted">
              Your email is how you sign in. Changing it is a separate step we
              have not opened yet — write to us from this address and we will
              move it for you.
            </p>
          </div>

          <div className="mt-6">
            <ProfileForm name={user.name} phone={user.phone ?? ""} />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-ink">
            Change password
          </h2>
          <p className="mt-1.5 text-small text-text-muted">
            Eight characters or more. Old favourites welcome as long as they are
            not anybody&apos;s favourites.
          </p>

          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}