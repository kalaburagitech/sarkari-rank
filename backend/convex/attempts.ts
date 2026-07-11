import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function stripQuestionAnswers<T extends { correctOptionId: string; explanation?: string }>(
  questions: T[]
): Omit<T, "correctOptionId" | "explanation">[] {
  return questions.map(({ correctOptionId, explanation, ...rest }) => rest);
}

export const startAttempt = mutation({
  args: { userId: v.id("users"), testId: v.id("tests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test || !test.isActive) throw new Error("Test not found");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (test.isPremium && !test.isFree && !user.isPremium) {
      throw new Error("Premium Pass required for this test");
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    if (questions.length === 0) {
      throw new Error("No questions available for this test yet. Admin can add questions from dashboard.");
    }

    const existing = await ctx.db
      .query("testAttempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("testAttempts", {
      userId: args.userId,
      testId: args.testId,
      answers: questions
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          questionId: q._id,
          isCorrect: false,
          timeSpentSeconds: 0,
        })),
      score: 0,
      totalMarks: test.totalMarks,
      accuracy: 0,
      timeTakenSeconds: 0,
      status: "in_progress",
      startedAt: Date.now(),
    });
  },
});

export const submitAnswer = mutation({
  args: {
    attemptId: v.id("testAttempts"),
    questionId: v.id("questions"),
    selectedOptionId: v.string(),
    timeSpentSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt || attempt.status !== "in_progress") {
      throw new Error("Invalid attempt");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const isCorrect = question.correctOptionId === args.selectedOptionId;
    const updatedAnswers = attempt.answers.map((a) =>
      a.questionId === args.questionId
        ? {
            ...a,
            selectedOptionId: args.selectedOptionId,
            isCorrect,
            timeSpentSeconds: args.timeSpentSeconds,
          }
        : a
    );

    await ctx.db.patch(args.attemptId, { answers: updatedAnswers });

    // Return correctness so the client can show instant feedback + explanation.
    return {
      isCorrect,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      explanationKn: question.explanationKn,
    };
  },
});

export const submitTest = mutation({
  args: { attemptId: v.id("testAttempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const test = await ctx.db.get(attempt.testId);
    if (!test) throw new Error("Test not found");

    let score = 0;
    let correct = 0;
    let totalTime = 0;

    for (const answer of attempt.answers) {
      totalTime += answer.timeSpentSeconds;
      if (answer.selectedOptionId) {
        const question = await ctx.db.get(answer.questionId);
        if (question) {
          if (answer.isCorrect) {
            score += question.marks;
            correct++;
          } else {
            score -= question.negativeMarks;
          }
        }
      }
    }

    const answered = attempt.answers.filter((a) => a.selectedOptionId).length;
    const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

    await ctx.db.patch(args.attemptId, {
      score: Math.max(0, score),
      accuracy,
      timeTakenSeconds: totalTime,
      status: "completed",
      completedAt: Date.now(),
    });

    await ctx.db.patch(attempt.testId, {
      attemptCount: test.attemptCount + 1,
    });

    const user = await ctx.db.get(attempt.userId);
    if (user) {
      await ctx.db.patch(attempt.userId, {
        totalTestsTaken: user.totalTestsTaken + 1,
        streak: user.streak + 1,
      });
    }

    // Update leaderboard
    const allAttempts = await ctx.db
      .query("testAttempts")
      .withIndex("by_test", (q) => q.eq("testId", attempt.testId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const sorted = allAttempts
      .sort((a, b) => b.score - a.score || a.timeTakenSeconds - b.timeTakenSeconds);

    const rank =
      sorted.findIndex((a) => a._id === args.attemptId) + 1;
    const percentile =
      allAttempts.length > 0
        ? ((allAttempts.length - rank) / allAttempts.length) * 100
        : 100;

    await ctx.db.patch(args.attemptId, { rank, percentile });

    const existingEntry = await ctx.db
      .query("leaderboard")
      .withIndex("by_test", (q) => q.eq("testId", attempt.testId))
      .filter((q) => q.eq(q.field("userId"), attempt.userId))
      .first();

    if (existingEntry) {
      if (score > existingEntry.score) {
        await ctx.db.patch(existingEntry._id, {
          score,
          timeTakenSeconds: totalTime,
          rank,
          updatedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("leaderboard", {
        userId: attempt.userId,
        testId: attempt.testId,
        score,
        timeTakenSeconds: totalTime,
        rank,
        updatedAt: Date.now(),
      });
    }

    return { score, accuracy, rank, percentile, correct, total: attempt.answers.length };
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

export const getInProgressAttempt = query({
  args: { userId: v.id("users"), testId: v.id("tests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("testAttempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();
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
      for (const answer of attempt.answers) {
        const q = await ctx.db.get(answer.questionId);
        if (q?.subject) {
          if (!subjectMap[q.subject]) subjectMap[q.subject] = { correct: 0, total: 0 };
          subjectMap[q.subject].total++;
          if (answer.isCorrect) subjectMap[q.subject].correct++;
        }
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

    const sorted = entries.sort((a, b) => a.rank - b.rank);
    const limited = sorted.slice(0, args.limit ?? 50);

    return await Promise.all(
      limited.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          rank: entry.rank,
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
