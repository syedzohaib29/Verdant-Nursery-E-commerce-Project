/**
 * Where a sign-in may send somebody afterwards.
 *
 * One helper, used by the pages that read `callbackUrl` off the query string and by
 * the server actions that act on it. Having it in one place is the point: an open
 * redirect on the sign-out or sign-in path turns a link from this site into a
 * convincing phishing page, and the check is three lines long enough that writing
 * it twice means one copy eventually misses a case.
 *
 * The rules are deliberately strict. A value has to be a single-slash-prefixed path
 * with no authority component and no backslash, because browsers treat `//evil.com`
 * and `/\evil.com` as protocol-relative URLs even though a naive string test would
 * not. Anything else falls back to the site root.
 */
export function safeCallbackUrl(
  value: string | string[] | undefined,
  fallback = "/",
): string {
  // `?callbackUrl=a&callbackUrl=b` arrives as an array. The first one wins, which
  // matches how the rest of the app reads repeated params.
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) return fallback;

  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;

  // A NUL, a newline or a tab inside a `Location` header is how header injection is
  // attempted. The comparison is on code points rather than a regex with literal
  // control characters in it, which is both easier to read and not something the
  // reader has to take on trust.
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);

    // Below 0x20 is C0, 0x7F is DEL. Nothing in a path has a business being either.
    if (code < 0x20 || code === 0x7f) return fallback;
  }

  return raw;
}
