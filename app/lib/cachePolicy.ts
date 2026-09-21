// The rule that decides whether a screen costs a database read.
// Pure on purpose — run it with:
//   node --experimental-strip-types lib/cachePolicy.ts
export type Versions = Record<string, number>;
export type Entry = { deps: Versions; data: unknown; at: number };

// Safety net: even if a counter never moves (a publish path that forgot to
// bump, a seed script), nothing on the device goes more than a day stale.
export const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Fresh → serve from cache, no network. Stale → re-read.
 * An empty `deps` list means user-specific data, which is never considered
 * fresh: it is refreshed whenever the device is online.
 */
export function isFresh(
  entry: Entry,
  deps: string[],
  current: Versions,
  now: number
): boolean {
  if (deps.length === 0) return false;
  if (now - entry.at > MAX_AGE_MS) return false;
  return deps.every((d) => entry.deps[d] === (current[d] ?? 0));
}

// ─── Self-check ──────────────────────────────────────────────
if (typeof process !== "undefined" && Array.isArray(process?.argv) && process.argv[1]?.endsWith("cachePolicy.ts")) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("FAIL: " + msg);
  };
  const now = 1_700_000_000_000;
  const entry = (deps: Versions, at = now): Entry => ({ deps, data: [], at });

  assert(isFresh(entry({ tests: 3 }), ["tests"], { tests: 3 }, now), "same counter → no read");
  assert(!isFresh(entry({ tests: 3 }), ["tests"], { tests: 4 }, now), "counter moved → re-read");
  assert(
    isFresh(entry({ tests: 3, exams: 1 }), ["tests", "exams"], { tests: 3, exams: 1 }, now),
    "all deps unchanged → no read"
  );
  assert(
    !isFresh(entry({ tests: 3, exams: 1 }), ["tests", "exams"], { tests: 3, exams: 2 }, now),
    "one dep moved → re-read"
  );
  // A never-published area reports no counter at all; 0 must match 0, or the
  // app would re-download everything on every launch.
  assert(isFresh(entry({ practice: 0 }), ["practice"], {}, now), "absent counter reads as 0");
  assert(!isFresh(entry({ tests: 3 }), [], { tests: 3 }, now), "user data always refreshes");
  assert(
    !isFresh(entry({ tests: 3 }, now - MAX_AGE_MS - 1), ["tests"], { tests: 3 }, now),
    "stale past 24h → re-read even if the counter stood still"
  );
  assert(
    isFresh(entry({ tests: 3 }, now - MAX_AGE_MS + 1000), ["tests"], { tests: 3 }, now),
    "just under 24h is still fresh"
  );
  console.log("cachePolicy: all checks passed");
}
