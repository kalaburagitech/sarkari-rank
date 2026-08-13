import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Study Notes ─────────────────────────────────────────────

export const listStudyNotes = query({
  args: {
    examId: v.optional(v.id("exams")),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let notes;
    if (args.examId) {
      notes = await ctx.db
        .query("studyNotes")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .collect();
    } else {
      notes = await ctx.db.query("studyNotes").collect();
    }
    return notes.filter((n) => args.includeInactive || n.isActive);
  },
});

export const getStudyNote = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyNotes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const createStudyNote = mutation({
  args: {
    examId: v.id("exams"),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    isPremium: v.boolean(),
    // Publish state — omit/true = published, false = draft.
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { isActive, ...rest } = args;
    return await ctx.db.insert("studyNotes", {
      ...rest,
      isActive: isActive ?? true,
      createdAt: Date.now(),
    });
  },
});

export const updateStudyNote = mutation({
  args: {
    id: v.id("studyNotes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    isPremium: v.optional(v.boolean()),
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

export const duplicateStudyNote = mutation({
  args: { id: v.id("studyNotes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _creationTime, ...rest } = note;
    return await ctx.db.insert("studyNotes", {
      ...rest,
      title: `${note.title} (Copy)`,
      slug: `${note.slug}-copy-${Date.now()}`,
      isActive: false,
      createdAt: Date.now(),
    });
  },
});

export const deleteStudyNote = mutation({
  args: { id: v.id("studyNotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Current Affairs ─────────────────────────────────────────

export const listCurrentAffairs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    // Read only ~limit newest active rows (creation order ≈ publish date)
    // instead of collecting the entire, ever-growing table on every call.
    const items = await ctx.db
      .query("currentAffairs")
      .order("desc")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(limit);
    return items.sort((a, b) => b.date - a.date);
  },
});

export const createCurrentAffair = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    summary: v.string(),
    category: v.string(),
    sourceUrl: v.optional(v.string()),
    sourceName: v.optional(v.string()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("currentAffairs", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updateCurrentAffair = mutation({
  args: {
    id: v.id("currentAffairs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    category: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceName: v.optional(v.string()),
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

export const deleteCurrentAffair = mutation({
  args: { id: v.id("currentAffairs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Daily Quiz ──────────────────────────────────────────────

export const getDailyQuiz = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const date =
      args.date ?? new Date().toISOString().split("T")[0];
    const quiz = await ctx.db
      .query("dailyQuizzes")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
    if (!quiz) return null;
    const test = await ctx.db.get(quiz.testId);
    if (!test) return null;

    const questionCount = (
      await ctx.db
        .query("questions")
        .withIndex("by_test", (q) => q.eq("testId", test._id))
        .collect()
    ).length;

    return {
      ...quiz,
      test: { ...test, totalQuestions: questionCount, liveQuestionCount: questionCount },
    };
  },
});

export const setDailyQuiz = mutation({
  args: { date: v.string(), testId: v.id("tests") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyQuizzes")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { testId: args.testId });
      return existing._id;
    }
    return await ctx.db.insert("dailyQuizzes", {
      date: args.date,
      testId: args.testId,
      isActive: true,
    });
  },
});

// ─── Doubts ──────────────────────────────────────────────────

export const submitDoubt = mutation({
  args: {
    userId: v.id("users"),
    questionText: v.string(),
    questionImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("doubts", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const listDoubts = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("answered"), v.literal("closed"))
    ),
  },
  handler: async (ctx, args) => {
    let doubts;
    if (args.userId) {
      doubts = await ctx.db
        .query("doubts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      doubts = await ctx.db.query("doubts").collect();
    }
    if (args.status) {
      doubts = doubts.filter((d) => d.status === args.status);
    }
    return doubts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const answerDoubt = mutation({
  args: { id: v.id("doubts"), answer: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      answer: args.answer,
      status: "answered",
      answeredAt: Date.now(),
    });
  },
});

// ─── Subscriptions ───────────────────────────────────────────

export const getSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("lifetime")
    ),
    amount: v.number(),
    paymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const durations = {
      monthly: 30 * 24 * 60 * 60 * 1000,
      yearly: 365 * 24 * 60 * 60 * 1000,
      lifetime: 100 * 365 * 24 * 60 * 60 * 1000,
    };

    const expiresAt = now + durations[args.plan];

    await ctx.db.patch(args.userId, {
      isPremium: true,
      premiumExpiresAt: expiresAt,
    });

    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      plan: args.plan,
      amount: args.amount,
      startsAt: now,
      expiresAt,
      isActive: true,
      paymentId: args.paymentId,
    });
  },
});

// ─── Dashboard Stats (Admin) ─────────────────────────────────

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [
      users,
      exams,
      tests,
      questions,
      attempts,
      subscriptions,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("exams").collect(),
      ctx.db.query("tests").collect(),
      ctx.db.query("questions").collect(),
      ctx.db.query("testAttempts").collect(),
      ctx.db.query("subscriptions").collect(),
    ]);

    const students = users.filter((u) => u.role === "student");
    const premiumUsers = students.filter((u) => u.isPremium);
    const completedAttempts = attempts.filter(
      (a) => a.status === "completed"
    );

    const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentAttempts = completedAttempts.filter(
      (a) => (a.completedAt ?? 0) > last7Days
    );

    return {
      totalUsers: students.length,
      premiumUsers: premiumUsers.length,
      totalExams: exams.filter((e) => e.isActive).length,
      totalTests: tests.filter((t) => t.isActive).length,
      totalQuestions: questions.length,
      totalAttempts: completedAttempts.length,
      recentAttempts: recentAttempts.length,
      activeSubscriptions: subscriptions.filter((s) => s.isActive).length,
      revenue: subscriptions.reduce((s, sub) => s + sub.amount, 0),
    };
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.role === "student")
      .map(({ passwordHash, ...rest }) => rest);
  },
});

// ─── Notifications ───────────────────────────────────────────

export const listNotifications = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("notifications").collect();
    return items
      .filter((n) => !args.userId || !n.userId || n.userId === args.userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);
  },
});

export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const createNotification = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    type: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
