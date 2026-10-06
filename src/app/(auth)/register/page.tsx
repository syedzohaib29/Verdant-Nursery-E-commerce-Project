import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/auth";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Create an account",
  description: "An account keeps your saved plants and your basket across devices.",
};

type Props = PageProps<"/register">;

/** Create an account. See `/login` — the same shape, for the same reasons. */
export default async function RegisterPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  if (session?.user) redirect(callbackUrl);

  return (
    <div className="mx-auto max-w-md">
      <p className="eyebrow">New here</p>
      <h1 className="mt-3 text-h2 text-ink">Start a collection.</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/60">
        A name and an email address is all it takes. The phone number is for
        delivery questions, and you can leave it blank.
      </p>

      <div className="mt-8">
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
