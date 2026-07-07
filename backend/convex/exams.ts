import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Exam Categories ─────────────────────────────────────────

export const listCategories = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const cats = await ctx.db.query("examCategories").collect();
    return cats
      .filter((c) => args.includeInactive || c.isActive)
      .sort((a, b) => a.order - b.order);
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
    isPopular: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("examCategories", { ...args, isActive: true });
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("examCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isPopular: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("examCategories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});

// ─── Exams ───────────────────────────────────────────────────

export const listExams = query({
  args: {
    categoryId: v.optional(v.id("examCategories")),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let exams;
    if (args.categoryId) {
      exams = await ctx.db
        .query("exams")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .collect();
    } else {
      exams = await ctx.db.query("exams").collect();
    }
    return exams
      .filter((e) => args.includeInactive || e.isActive)
      .sort((a, b) => a.order - b.order);
  },
});

export const getExam = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exams")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const createExam = mutation({
  args: {
    categoryId: v.id("examCategories"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("exams", {
      ...args,
      totalTests: 0,
      isActive: true,
    });
  },
});

export const updateExam = mutation({
  args: {
    id: v.id("exams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deleteExam = mutation({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});

// ─── Test Series ─────────────────────────────────────────────

export const listTestSeries = query({
  args: {
    examId: v.optional(v.id("exams")),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let series;
    if (args.examId) {
      series = await ctx.db
        .query("testSeries")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .collect();
    } else {
      series = await ctx.db.query("testSeries").collect();
    }
    return series.filter((s) => args.includeInactive || s.isActive);
  },
});

export const createTestSeries = mutation({
  args: {
    examId: v.id("exams"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    isFree: v.boolean(),
    isPremium: v.boolean(),
    price: v.optional(v.number()),
    languages: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("testSeries", {
      ...args,
      totalTests: 0,
      totalQuestions: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updateTestSeries = mutation({
  args: {
    id: v.id("testSeries"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    price: v.optional(v.number()),
    languages: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

// ─── Tests ───────────────────────────────────────────────────

export const listTests = query({
  args: {
    examId: v.optional(v.id("exams")),
    testSeriesId: v.optional(v.id("testSeries")),
    type: v.optional(
      v.union(
        v.literal("mock"),
        v.literal("live"),
        v.literal("chapter"),
        v.literal("subject"),
        v.literal("pyp"),
        v.literal("daily"),
        v.literal("practice")
      )
    ),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tests;
    if (args.testSeriesId) {
      tests = await ctx.db
        .query("tests")
        .withIndex("by_series", (q) =>
          q.eq("testSeriesId", args.testSeriesId!)
        )
        .collect();
    } else if (args.examId) {
      tests = await ctx.db
        .query("tests")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .collect();
    } else if (args.type) {
      tests = await ctx.db
        .query("tests")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else {
      tests = await ctx.db.query("tests").collect();
    }
    const activeTests = tests.filter((t) => args.includeInactive || t.isActive);

    return await Promise.all(
      activeTests.map(async (test) => {
        const questionCount = (
          await ctx.db
            .query("questions")
            .withIndex("by_test", (q) => q.eq("testId", test._id))
            .collect()
        ).length;
        return { ...test, totalQuestions: questionCount, liveQuestionCount: questionCount };
      })
    );
  },
});

export const getTest = query({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.id);
    if (!test) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test", (q) => q.eq("testId", args.id))
      .collect();

    return {
      ...test,
      totalQuestions: questions.length,
      liveQuestionCount: questions.length,
    };
  },
});

export const createTest = mutation({
  args: {
    testSeriesId: v.optional(v.id("testSeries")),
    examId: v.id("exams"),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("mock"),
      v.literal("live"),
      v.literal("chapter"),
      v.literal("subject"),
      v.literal("pyp"),
      v.literal("daily"),
      v.literal("practice")
    ),
    durationMinutes: v.number(),
    totalMarks: v.number(),
    negativeMarking: v.number(),
    passingMarks: v.optional(v.number()),
    languages: v.array(v.string()),
    isFree: v.boolean(),
    isPremium: v.boolean(),
    scheduledAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const testId = await ctx.db.insert("tests", {
      ...args,
      totalQuestions: 0,
      isActive: true,
      attemptCount: 0,
      createdAt: Date.now(),
    });

    if (args.testSeriesId) {
      const series = await ctx.db.get(args.testSeriesId);
      if (series) {
        await ctx.db.patch(args.testSeriesId, {
          totalTests: series.totalTests + 1,
        });
      }
    }

    const exam = await ctx.db.get(args.examId);
    if (exam) {
      await ctx.db.patch(args.examId, { totalTests: exam.totalTests + 1 });
    }

    return testId;
  },
});

export const updateTest = mutation({
  args: {
    id: v.id("tests"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    totalMarks: v.optional(v.number()),
    negativeMarking: v.optional(v.number()),
    isFree: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    scheduledAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deleteTest = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});

// ─── Questions ───────────────────────────────────────────────

export const listQuestions = query({
  args: { testId: v.id("tests"), includeAnswers: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_order", (q) => q.eq("testId", args.testId))
      .collect();
    return questions.sort((a, b) => a.order - b.order).map((q) => {
      if (args.includeAnswers) return q;
      const { correctOptionId, explanation, ...rest } = q;
      return rest;
    });
  },
});

export const createQuestion = mutation({
  args: {
    testId: v.id("tests"),
    questionText: v.string(),
    questionImage: v.optional(v.string()),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        image: v.optional(v.string()),
      })
    ),
    correctOptionId: v.string(),
    explanation: v.optional(v.string()),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    marks: v.number(),
    negativeMarks: v.number(),
    order: v.number(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("questions", args);
    const test = await ctx.db.get(args.testId);
    if (test) {
      await ctx.db.patch(args.testId, {
        totalQuestions: test.totalQuestions + 1,
      });
    }
    return questionId;
  },
});

export const bulkCreateQuestions = mutation({
  args: {
    testId: v.id("tests"),
    questions: v.array(
      v.object({
        questionText: v.string(),
        options: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
          })
        ),
        correctOptionId: v.string(),
        explanation: v.optional(v.string()),
        subject: v.optional(v.string()),
        topic: v.optional(v.string()),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard")
        ),
        marks: v.number(),
        negativeMarks: v.number(),
        order: v.number(),
        language: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const q of args.questions) {
      const id = await ctx.db.insert("questions", {
        testId: args.testId,
        ...q,
      });
      ids.push(id);
    }
    const test = await ctx.db.get(args.testId);
    if (test) {
      await ctx.db.patch(args.testId, {
        totalQuestions: test.totalQuestions + args.questions.length,
      });
    }
    return ids;
  },
});

export const updateQuestion = mutation({
  args: {
    id: v.id("questions"),
    questionText: v.optional(v.string()),
    options: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          image: v.optional(v.string()),
        })
      )
    ),
    correctOptionId: v.optional(v.string()),
    explanation: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    marks: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deleteQuestion = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.id);
    if (question) {
      await ctx.db.delete(args.id);
      const test = await ctx.db.get(question.testId);
      if (test) {
        await ctx.db.patch(question.testId, {
          totalQuestions: Math.max(0, test.totalQuestions - 1),
        });
      }
    }
  },
});
