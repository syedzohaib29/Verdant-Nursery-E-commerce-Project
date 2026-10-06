"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { z } from "zod";

import { signIn } from "@/auth";
import { createAccount, emailInUse } from "@/lib/data/users";
import { clearFailures, recordFailure } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/redirects";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

/*
  Sign in and register are server actions rather than client calls into
  `/api/auth` for one reason that matters more than the network round trip: the credentials never
  leave the server process. A password posted from the browser to a route handler
  passes through code that is not ours; a password handed to a server action
  arrives as a function argument and is hashed on this machine.

  Neither action reveals whether an address is registered. `emailInUse` exists
  only for signup, where the address is something the person just typed in front
  of us and cannot be enumerated without already knowing it.
*/

export type AuthResult = {
  success: boolean;
  /** Form-level message, when the field itself was fine. */
  error: string | null;
  fieldErrors: Record<string, string[]>;
};

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

/**
 * The caller's address, for the sign-in throttle.
 *
 * `x-forwarded-for` is a list because every proxy in the chain appends to it, and
 * the first entry is the one the nearest proxy saw. With no proxy at all — which
 * is what local development looks like — both headers are absent and everything
 * falls back to one shared bucket, so the limit still works per email address,
 * which is the half that matters when the attacker chooses their target.
 */
async function clientAddress(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");

  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return requestHeaders.get("x-real-ip") ?? "unknown";
}

/** Same message for a wrong address and a wrong password. See `verifyCredentials`. */
const SIGN_IN_FAILED =
  "That email and password do not match anything we have on file.";

/**
 * Signs in with an email and password.
 *
 * `signIn` throws on failure and on success alike: the success case is a redirect
 * the framework completes, the failure case is an `AuthError` the form shows. So
 * the catch is not optional error handling, it is the whole control flow — a
 * `CredentialsSignin` becomes a message, and anything else is rethrown so a real
 * fault still reaches the error boundary instead of being reported as a typo in
 * somebody's email address.
 *
 * The throttle sits *after* validation and *before* the password check, so a
 * half-typed form never spends the budget — only an attempt that could actually
 * have succeeded counts against it. See `src/lib/rate-limit.ts` for what it does
 * and, more usefully, what it does not do.
 */
export async function signInWithCredentials(input: {
  email: string;
  password: string;
  redirectTo: string;
}): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const ip = await clientAddress();
  const throttle = recordFailure(parsed.data.email, ip);

  if (throttle.limited) {
    const minutes = Math.max(1, Math.ceil(throttle.retryAfterSeconds / 60));

    return {
      success: false,
      error: `Too many sign-in attempts. Try again in about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
      fieldErrors: {},
    };
  }

  // Re-checked here rather than trusted from the form, because the form is in the
  // browser. See `safeCallbackUrl` for why this is worth three lines and a helper.
  const redirectTo = safeCallbackUrl(input.redirectTo);

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: SIGN_IN_FAILED, fieldErrors: {} };
    }

    // Reaching here unthrown means the credentials were right: the only other
    // thing `signIn` throws is the redirect that completes a successful sign-in.
    // A customer who mistyped twice and then got in should not carry those two
    // attempts for the next quarter of an hour.
    clearFailures(parsed.data.email, ip);
    throw error;
  }

  // Unreachable in practice: a successful `signIn` always throws its redirect.
  return { success: false, error: SIGN_IN_FAILED, fieldErrors: {} };
}

/**
 * Creates an account and signs the new customer straight in.
 *
 * Signing in afterwards rather than asking for a second round trip is the whole
 * point of a register page. If the sign-in then fails — which should not happen
 * for an account this function just wrote — the account still exists and the
 * message says so, so the person can go and sign in instead of filling the form
 * in again with an address that is now taken.
 */
export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  redirectTo: string;
}): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Check the form and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  // `confirmPassword` is deliberately not pulled out: the schema has already used
  // it to prove the two entries match, and the hash is all that ever gets stored.
  const { name, email, password, phone } = parsed.data;
  const redirectTo = safeCallbackUrl(input.redirectTo);

  try {
    if (await emailInUse(email)) {
      return {
        success: false,
        error: "We already have an account with that address.",
        fieldErrors: {
          email: ["That address is already registered. Try signing in instead."],
        },
      };
    }

    const created = await createAccount({ name, email, password, phone });

    if (!created.ok) {
      return {
        success: false,
        error:
          created.reason === "email-taken"
            ? "We already have an account with that address."
            : "We could not create that account. Try again in a moment.",
        fieldErrors: {},
      };
    }

    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Your account is ready, but we could not sign you in. Try signing in.",
        fieldErrors: {},
      };
    }

    throw error;
  }

  return { success: false, error: "Your account is ready, but we could not sign you in.", fieldErrors: {} };
}
