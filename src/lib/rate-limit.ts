/*
  A small, in-memory sign-in throttle.

  Keyed by email *and* IP rather than by either alone. IP alone would let one
  office block itself out by sharing a connection; email alone would let anybody
  anywhere lock a customer out of their own account by typing their address
  repeatedly, which is a denial of service you can aim at a person. Together they
  describe the thing actually being attempted — one machine guessing at one
  account — and neither axis can be used to harm the other.

  Its limitations, which are real and worth stating rather than discovering later:

  - The map lives in this process. Restart the server and every counter is lost,
    so it is a speed bump for a patient attacker, not a wall.
  - With more than one instance (or a serverless deployment where each invocation
    may be cold) the counters are not shared, so the effective limit is per
    instance rather than global. A real deployment wants Redis, or the same logic
    pushed to an edge store, and this file is the seam where that would go.
  - It counts attempts, not successes, and it never tells the caller which of the
    two happened — the message is deliberately identical either way.

  Entries are swept lazily: whenever a new run of attempts starts, the pass that
  creates it also drops every other bucket whose window has already closed. That
  keeps the map bounded by the rate of sign-in attempts — the only thing adding
  to it — without a timer that would keep a Node process alive.
*/

/** How long a run of attempts is counted over. */
const WINDOW_MS = 15 * 60_000;

/** Attempts allowed inside one window before the address is made to wait. */
const MAX_ATTEMPTS = 5;

type Bucket = {
  attempts: number;
  /** Epoch milliseconds at which this run stops counting. */
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function key(email: string, ip: string): string {
  // Lowercased because the validation layer normalises addresses to lowercase and
  // a key that differed by case would be a second, separate counter.
  return `${email.trim().toLowerCase()}|${ip}`;
}

function sweep(now: number): void {
  for (const [id, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(id);
  }
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

/**
 * Records one failed attempt and says whether the next one has to wait.
 *
 * Call it once per rejected attempt, not once per request: a request that fails
 * validation before it ever reaches the password check has not guessed at
 * anything and should not spend the customer's budget.
 */
export function recordFailure(email: string, ip: string): RateLimitResult {
  const now = Date.now();
  const id = key(email, ip);
  const existing = buckets.get(id);

  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { attempts: 1, resetAt: now + WINDOW_MS });
    sweep(now);
    return { limited: false };
  }

  existing.attempts += 1;

  if (existing.attempts <= MAX_ATTEMPTS) return { limited: false };

  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Forgets a run of failures. Called after a success, so a typo is not held on to. */
export function clearFailures(email: string, ip: string): void {
  buckets.delete(key(email, ip));
}
