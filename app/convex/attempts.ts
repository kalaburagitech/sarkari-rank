import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function stripQuestionAnswers<T extends { correctOptionId: string; explanation?: string }>(
  questions: T[]
): Omit<T, "correctOptionId" | "explanation">[] {
  return questions.map(({ correctOptionId, explanation, ...rest }) => rest);
}

// One write per finished attempt. The app runs the whole test offline from
// its cached question set and posts the graded result here — the old
// start/answer-per-tap/submit trio meant ~2N round trips and rewrote the full
// answers array on every option tap.
export const recordAttempt = mutation({
  args: {
    userId: v.id("users"),
    testId: v.id("tests"),
    startedAt: v.number(),
    timeTakenSeconds: v.number(),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOptionId: v.optional(v.string()),
        timeSpentSeconds: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Grade server-side so a tampered client can't post a fake score.
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();
    const byId = new Map(questions.map((q) => [q._id, q]));

    let score = 0;
    let correct = 0;
    const subjects: Record<string, { correct: number; total: number }> = {};
    const graded = args.answers.map((a) => {
      const q = byId.get(a.questionId);
      const isCorrect = !!q && !!a.selectedOptionId && q.correctOptionId === a.selectedOptionId;
      if (q && a.selectedOptionId) {
        if (isCorrect) {
          score += q.marks;
          correct++;
        } else {
          score -= q.negativeMarks;
        }
        if (q.subject) {
          const bucket = (subjects[q.subject] ??= { correct: 0, total: 0 });
          bucket.total++;
          if (isCorrect) bucket.correct++;
        }
      }
      return { ...a, isCorrect };
    });

    const answered = graded.filter((a) => a.selectedOptionId).length;
    const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
    score = Math.max(0, score);

    const attemptId = await ctx.db.insert("testAttempts", {
      userId: args.userId,
      testId: args.testId,
      answers: graded,
      score,
      totalMarks: test.totalMarks,
      accuracy,
      timeTakenSeconds: args.timeTakenSeconds,
      status: "completed",
      startedAt: args.startedAt,
      completedAt: Date.now(),
      // Rolled up here so the analytics screen never re-reads question docs.
      subjectStats: Object.entries(subjects).map(([subject, d]) => ({
        subject,
        correct: d.correct,
        total: d.total,
      })),
    });

    await ctx.db.patch(args.testId, { attemptCount: test.attemptCount + 1 });

    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        totalTestsTaken: user.totalTestsTaken + 1,
        streak: user.streak + 1,
      });
    }

    // Leaderboard keeps one row per user per test; rank is worked out by the
    // leaderboard screen, so a submit never reads every other attempt.
    const existing = await ctx.db
      .query("leaderboard")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (existing) {
      if (score > existing.score) {
        await ctx.db.patch(existing._id, {
          score,
          timeTakenSeconds: args.timeTakenSeconds,
          updatedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("leaderboard", {
        userId: args.userId,
        testId: args.testId,
        score,
        timeTakenSeconds: args.timeTakenSeconds,
        rank: 0,
        updatedAt: Date.now(),
      });
    }

    return { attemptId, score, accuracy, correct, total: graded.length };
  },
});

export const getAttempt = query({
  args: { attemptId: v.id("testAttempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;

    const test = await ctx.db.get(attempt.testId);
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test", (q) => q.eq("testId", attempt.testId))
      .collect();

    const sorted = questions.sort((a, b) => a.order - b.order);
    const includeSolutions = attempt.status === "completed";

    return {
      ...attempt,
      test,
      questions: includeSolutions ? sorted : stripQuestionAnswers(sorted),
    };
  },
});

export const getUserAttempts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("testAttempts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      attempts.map(async (a) => {
        const test = await ctx.db.get(a.testId);
        return { ...a, testTitle: test?.title, testType: test?.type };
      })
    );

    return enriched.sort(
      (a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt)
    );
  },
});

export const getPerformanceAnalytics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("testAttempts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    if (attempts.length === 0) {
      return {
        totalTests: 0,
        avgScore: 0,
        avgAccuracy: 0,
        bestRank: null,
        subjectBreakdown: [],
        recentAttempts: [],
      };
    }

    const avgScore =
      attempts.reduce((s, a) => s + a.score, 0) / attempts.length;
    const avgAccuracy =
      attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length;
    const ranks = attempts.filter((a) => a.rank).map((a) => a.rank!);
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;

    const subjectMap: Record<string, { correct: number; total: number }> = {};
    for (const attempt of attempts) {
      for (const s of attempt.subjectStats ?? []) {
        const bucket = (subjectMap[s.subject] ??= { correct: 0, total: 0 });
        bucket.total += s.total;
        bucket.correct += s.correct;
      }
    }

    const subjectBreakdown = Object.entries(subjectMap).map(
      ([subject, data]) => ({
        subject,
        accuracy: (data.correct / data.total) * 100,
        total: data.total,
      })
    );

    const recentAttempts = attempts
      .slice(-5)
      .reverse()
      .map((a) => ({
        score: a.score,
        accuracy: a.accuracy,
        rank: a.rank,
        completedAt: a.completedAt,
      }));

    return {
      totalTests: attempts.length,
      avgScore,
      avgAccuracy,
      bestRank,
      subjectBreakdown,
      recentAttempts,
    };
  },
});

export const getLeaderboard = query({
  args: { testId: v.id("tests"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboard")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const sorted = entries.sort(
      (a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds
    );
    const limited = sorted.slice(0, args.limit ?? 50);

    return await Promise.all(
      limited.map(async (entry, i) => {
        const user = await ctx.db.get(entry.userId);
        return {
          rank: i + 1,
          score: entry.score,
          timeTakenSeconds: entry.timeTakenSeconds,
          userName: user?.name ?? "Anonymous",
          avatarUrl: user?.avatarUrl,
        };
      })
    );
  },
});

export const toggleBookmark = mutation({
  args: {
    userId: v.id("users"),
    questionId: v.optional(v.id("questions")),
    testId: v.optional(v.id("tests")),
    type: v.union(v.literal("question"), v.literal("test")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        args.type === "question"
          ? q.eq(q.field("questionId"), args.questionId!)
          : q.eq(q.field("testId"), args.testId!)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("bookmarks", {
      userId: args.userId,
      questionId: args.questionId,
      testId: args.testId,
      type: args.type,
      createdAt: Date.now(),
    });
    return { bookmarked: true };
  },
});

export const getBookmarks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
