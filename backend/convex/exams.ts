import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
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

// Hard-delete a test series along with all its tests and their questions.
export const deleteTestSeriesCascade = mutation({
  args: { id: v.id("testSeries") },
  handler: async (ctx, args) => {
    const tests = await ctx.db
      .query("tests")
      .withIndex("by_series", (q) => q.eq("testSeriesId", args.id))
      .collect();
    let removedQuestions = 0;
    for (const t of tests) {
      const qs = await ctx.db
        .query("questions")
        .withIndex("by_test", (q) => q.eq("testId", t._id))
        .collect();
      for (const q of qs) await ctx.db.delete(q._id);
      removedQuestions += qs.length;
      await ctx.db.delete(t._id);
    }
    await ctx.db.delete(args.id);
    return { removedTests: tests.length, removedQuestions };
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
    year: v.optional(v.number()),
    durationMinutes: v.number(),
    totalMarks: v.number(),
    negativeMarking: v.number(),
    passingMarks: v.optional(v.number()),
    languages: v.array(v.string()),
    isFree: v.boolean(),
    isPremium: v.boolean(),
    // Publish state — omit/true = published, false = draft.
    isActive: v.optional(v.boolean()),
    scheduledAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const testId = await ctx.db.insert("tests", {
      ...args,
      totalQuestions: 0,
      isActive: args.isActive ?? true,
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
    year: v.optional(v.number()),
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

// Hard-delete a test (Previous Year paper / series test) AND its questions.
// Used by the paper/series managers where "Delete" must actually remove content.
export const deleteTestCascade = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test", (q) => q.eq("testId", args.id))
      .collect();
    for (const q of questions) await ctx.db.delete(q._id);
    await ctx.db.delete(args.id);
    return { deletedQuestions: questions.length };
  },
});

// ─── Questions ───────────────────────────────────────────────

export const listQuestions = query({
  args: {
    testId: v.id("tests"),
    includeAnswers: v.optional(v.boolean()),
    // Admin previews can opt in; students never receive draft questions.
    includeDrafts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_test_order", (q) => q.eq("testId", args.testId))
      .collect();
    return questions
      .filter((q) => args.includeDrafts || q.status !== "draft")
      .sort((a, b) => a.order - b.order)
      .map((q) => {
        if (args.includeAnswers) return q;
        const { correctOptionId, explanation, explanationKn, ...rest } = q;
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
        questionTextKn: v.optional(v.string()),
        optionsKn: v.optional(
          v.array(v.object({ id: v.string(), text: v.string() }))
        ),
        explanationKn: v.optional(v.string()),
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
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    marks: v.optional(v.number()),
    negativeMarks: v.optional(v.number()),
    language: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
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

// Copy a question into the SAME test as a new draft (fast content entry).
export const duplicateQuestion = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const q = await ctx.db.get(args.id);
    if (!q) throw new Error("Question not found");
    const siblings = await ctx.db
      .query("questions")
      .withIndex("by_test", (t) => t.eq("testId", q.testId))
      .collect();
    const maxOrder = siblings.reduce((m, s) => Math.max(m, s.order), 0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _creationTime, ...rest } = q;
    const newId = await ctx.db.insert("questions", {
      ...rest,
      questionText: `${q.questionText} (Copy)`,
      order: maxOrder + 1,
      status: "draft",
    });
    const test = await ctx.db.get(q.testId);
    if (test) {
      await ctx.db.patch(q.testId, {
        totalQuestions: test.totalQuestions + 1,
      });
    }
    return newId;
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

// ─── Smart Add Question ──────────────────────────────────────
// Hides the "questions live inside a test" concept from the admin.
// Resolves (or creates) the right container test based on the chosen
// content type, then attaches the question. Enforces required context
// server-side so questions can't be filed in the wrong place.

async function bumpExamTests(ctx: MutationCtx, examId: Id<"exams">) {
  const exam = await ctx.db.get(examId);
  if (exam) await ctx.db.patch(examId, { totalTests: exam.totalTests + 1 });
}

type QuestionPayload = {
  questionText: string;
  options: { id: string; text: string; image?: string }[];
  correctOptionId: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
  language: string;
  status?: "draft" | "published";
};

// Inserts the question into a resolved container test and keeps its count in sync.
async function attachQuestion(
  ctx: MutationCtx,
  containerId: Id<"tests">,
  p: QuestionPayload
) {
  const container = await ctx.db.get(containerId);
  const order = (container?.totalQuestions ?? 0) + 1;
  const questionId = await ctx.db.insert("questions", {
    testId: containerId,
    questionText: p.questionText,
    options: p.options,
    correctOptionId: p.correctOptionId,
    explanation: p.explanation,
    subject: p.subject,
    topic: p.topic,
    difficulty: p.difficulty,
    marks: p.marks,
    negativeMarks: p.negativeMarks,
    order,
    language: p.language,
    status: p.status ?? "published",
  });
  if (container)
    await ctx.db.patch(containerId, {
      totalQuestions: container.totalQuestions + 1,
    });
  return { questionId, testId: containerId };
}

export const addQuestion = mutation({
  args: {
    questionType: v.union(
      v.literal("practice"),
      v.literal("pyp"),
      v.literal("testSeries")
    ),
    examId: v.id("exams"),
    // Practice context
    subject: v.optional(v.string()),
    topic: v.optional(v.string()), // "chapter"
    // Previous Year context
    year: v.optional(v.number()),
    paperName: v.optional(v.string()),
    // Test Series context
    testSeriesId: v.optional(v.id("testSeries")),
    testId: v.optional(v.id("tests")),
    testName: v.optional(v.string()),
    // Question payload
    questionText: v.string(),
    options: v.array(
      v.object({ id: v.string(), text: v.string(), image: v.optional(v.string()) })
    ),
    correctOptionId: v.string(),
    explanation: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    marks: v.number(),
    negativeMarks: v.number(),
    language: v.string(),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("Exam not found");

    let containerId: Id<"tests">;

    // Direct target: when a specific container test is known (e.g. adding
    // into an existing Previous Year paper or series test), use it as-is.
    if (args.testId) {
      const target = await ctx.db.get(args.testId);
      if (!target) throw new Error("Target test not found");
      containerId = args.testId;
      return await attachQuestion(ctx, containerId, args);
    }

    const examTests = await ctx.db
      .query("tests")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    if (args.questionType === "practice") {
      if (!args.subject?.trim())
        throw new Error("Subject is required for Practice questions");
      const title = `${exam.name} — Practice Questions`;
      const existing = examTests.find(
        (t) => t.type === "practice" && t.title === title
      );
      containerId =
        existing?._id ??
        (await ctx.db.insert("tests", {
          examId: args.examId,
          title,
          slug: `${exam.slug}-practice`,
          description: `Practice question bank for ${exam.name}`,
          type: "practice",
          durationMinutes: 0,
          totalQuestions: 0,
          totalMarks: 0,
          negativeMarking: args.negativeMarks,
          languages: [args.language],
          isFree: true,
          isPremium: false,
          isActive: true,
          attemptCount: 0,
          createdAt: Date.now(),
        }));
      if (!existing) await bumpExamTests(ctx, args.examId);
    } else if (args.questionType === "pyp") {
      if (!args.year) throw new Error("Year is required for Previous Year papers");
      if (!args.paperName?.trim())
        throw new Error("Paper name is required for Previous Year papers");
      const title = args.paperName.trim();
      const existing = examTests.find(
        (t) => t.type === "pyp" && t.year === args.year && t.title === title
      );
      containerId =
        existing?._id ??
        (await ctx.db.insert("tests", {
          examId: args.examId,
          title,
          slug: `${exam.slug}-pyp-${args.year}-${Date.now()}`,
          description: `${exam.name} previous year paper (${args.year})`,
          type: "pyp",
          year: args.year,
          durationMinutes: 60,
          totalQuestions: 0,
          totalMarks: 0,
          negativeMarking: args.negativeMarks,
          languages: [args.language],
          isFree: true,
          isPremium: false,
          isActive: true,
          attemptCount: 0,
          createdAt: Date.now(),
        }));
      if (!existing) await bumpExamTests(ctx, args.examId);
    } else {
      // testSeries
      if (!args.testSeriesId)
        throw new Error("Test Series is required for Test Series questions");
      if (!args.testName?.trim())
        throw new Error("Test name is required for Test Series questions");
      const title = args.testName.trim();
      const existing = examTests.find(
        (t) => t.testSeriesId === args.testSeriesId && t.title === title
      );
      containerId =
        existing?._id ??
        (await ctx.db.insert("tests", {
          testSeriesId: args.testSeriesId,
          examId: args.examId,
          title,
          slug: `${exam.slug}-${Date.now()}`,
          description: title,
          type: "mock",
          durationMinutes: 60,
          totalQuestions: 0,
          totalMarks: 0,
          negativeMarking: args.negativeMarks,
          languages: [args.language],
          isFree: false,
          isPremium: true,
          isActive: true,
          attemptCount: 0,
          createdAt: Date.now(),
        }));
      if (!existing) {
        await bumpExamTests(ctx, args.examId);
        const series = await ctx.db.get(args.testSeriesId);
        if (series)
          await ctx.db.patch(args.testSeriesId, {
            totalTests: series.totalTests + 1,
          });
      }
    }

    return await attachQuestion(ctx, containerId, args);
  },
});

// ─── Rich question list for the admin "All Questions" view ───
// Enriches each question with its exam + container-test context in a
// single pass (admin scale). Optional filters keep result sets small.
export const listQuestionsRich = query({
  args: {
    examId: v.optional(v.id("exams")),
    testId: v.optional(v.id("tests")),
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
  },
  handler: async (ctx, args) => {
    const exams = await ctx.db.query("exams").collect();
    const examById = new Map(exams.map((e) => [e._id, e]));

    // Resolve the set of container tests we care about.
    let tests;
    if (args.testId) {
      const t = await ctx.db.get(args.testId);
      tests = t ? [t] : [];
    } else if (args.examId) {
      tests = await ctx.db
        .query("tests")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .collect();
    } else {
      tests = await ctx.db.query("tests").collect();
    }
    if (args.type) tests = tests.filter((t) => t.type === args.type);

    const rows = [];
    for (const test of tests) {
      const qs = await ctx.db
        .query("questions")
        .withIndex("by_test", (q) => q.eq("testId", test._id))
        .collect();
      for (const q of qs) {
        const exam = examById.get(test.examId);
        rows.push({
          ...q,
          examId: test.examId,
          examName: exam?.name ?? "—",
          testId: test._id,
          testTitle: test.title,
          testType: test.type,
          year: test.year,
          status: q.status ?? "published",
        });
      }
    }
    // Newest first, then by order.
    rows.sort((a, b) => b._creationTime - a._creationTime);
    return rows;
  },
});
