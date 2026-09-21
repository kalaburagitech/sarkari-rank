import { mutation, query } from "./_generated/server";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Content areas the app caches on-device. Every publish bumps the matching
// counter; the app compares counters and only re-downloads what moved, so a
// student who opens the app on a day with no new content costs zero reads.
export type SyncKey =
  | "categories"
  | "exams"
  | "tests"
  | "studyNotes"
  | "currentAffairs"
  | "notifications"
  | "practice"
  | "doubts"
  | "dailyQuiz";

export async function touch(ctx: MutationCtx, key: SyncKey) {
  const row = await ctx.db
    .query("syncMeta")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (row) await ctx.db.patch(row._id, { version: row.version + 1, updatedAt: Date.now() });
  else await ctx.db.insert("syncMeta", { key, version: 1, updatedAt: Date.now() });
}

// Question edits bump the owning test's own counter as well, so one test's
// new questions don't invalidate every other test cached on the device.
export async function touchTestQuestions(ctx: MutationCtx, testId: Id<"tests">) {
  const test = await ctx.db.get(testId);
  if (test) await ctx.db.patch(testId, { qv: (test.qv ?? 0) + 1 });
  await touch(ctx, "tests");
}

// Every content area moves when a seed runs; bump them all so devices refresh.
export async function touchAll(ctx: MutationCtx) {
  const keys: SyncKey[] = [
    "categories", "exams", "tests", "studyNotes", "currentAffairs",
    "notifications", "practice", "doubts", "dailyQuiz",
  ];
  for (const k of keys) await touch(ctx, k);
}

export async function bumpCounter(ctx: MutationCtx, key: string, delta: number) {
  const row = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (row) await ctx.db.patch(row._id, { value: row.value + delta });
  else await ctx.db.insert("counters", { key, value: delta });
}

export async function readCounter(ctx: QueryCtx, key: string) {
  const row = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  return row?.value ?? 0;
}

export const versions = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("syncMeta").collect();
    const out: Record<string, number> = {};
    for (const r of rows) out[r.key] = r.version;
    return out;
  },
});

// Seeds the running totals from the data already in the database. One-off
// after deploying counters; safe to re-run (it recounts, not increments).
export const backfillCounters = mutation({
  args: {},
  handler: async (ctx) => {
    const attempts = await ctx.db.query("testAttempts").collect();
    const row = await ctx.db
      .query("counters")
      .withIndex("by_key", (q) => q.eq("key", "attempts"))
      .first();
    if (row) await ctx.db.patch(row._id, { value: attempts.length });
    else await ctx.db.insert("counters", { key: "attempts", value: attempts.length });
    return { attempts: attempts.length };
  },
});
