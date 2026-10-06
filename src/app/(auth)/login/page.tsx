import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/auth";
import { safeCallbackUrl } from "@/lib/redirects";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to see your saved plants and your basket on any device.",
};

type Props = PageProps<"/login">;

/**
 * Sign in.
 *
 * The `callbackUrl` guard runs on the server as well as in the form. Reading it off
 * the query string is how the return path survives the round trip, and checking it
 * here means a crafted link cannot survive being handed to the action.
 *
 * Somebody who is already signed in has no business here, so they are sent onward
 * rather than shown a form that would just fail.
 */
export default async function LoginPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  if (session?.user) redirect(callbackUrl);

  return (
    <div className="mx-auto max-w-md">
      <p className="eyebrow">Sign in</p>
      <h1 className="mt-3 text-h2 text-ink">Welcome back.</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/60">
        Your plants missed you. Your saved list and your basket are sitting
        exactly where you left them.
      </p>

      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
