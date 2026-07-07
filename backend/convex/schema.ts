import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ───────────────────────────────────────────────
  users: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("admin")),
    passwordHash: v.optional(v.string()),
    isPremium: v.boolean(),
    premiumExpiresAt: v.optional(v.number()),
    streak: v.number(),
    totalTestsTaken: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ─── Exam Categories ─────────────────────────────────────
  examCategories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
    isPopular: v.boolean(),
    order: v.number(),
    isActive: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

  // ─── Exams ───────────────────────────────────────────────
  exams: defineTable({
    categoryId: v.id("examCategories"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    totalTests: v.number(),
    isActive: v.boolean(),
    order: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_slug", ["slug"]),

  // ─── Test Series ─────────────────────────────────────────
  testSeries: defineTable({
    examId: v.id("exams"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    totalTests: v.number(),
    totalQuestions: v.number(),
    isFree: v.boolean(),
    isPremium: v.boolean(),
    price: v.optional(v.number()),
    languages: v.array(v.string()),
    tags: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_exam", ["examId"])
    .index("by_slug", ["slug"]),

  // ─── Tests (Mock / Live / Chapter / Subject / PYP) ───────
  tests: defineTable({
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
    totalQuestions: v.number(),
    totalMarks: v.number(),
    negativeMarking: v.number(),
    passingMarks: v.optional(v.number()),
    languages: v.array(v.string()),
    isFree: v.boolean(),
    isPremium: v.boolean(),
    scheduledAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    isActive: v.boolean(),
    attemptCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_exam", ["examId"])
    .index("by_series", ["testSeriesId"])
    .index("by_type", ["type"])
    .index("by_slug", ["slug"]),

  // ─── Questions ───────────────────────────────────────────
  questions: defineTable({
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
  })
    .index("by_test", ["testId"])
    .index("by_test_order", ["testId", "order"]),

  // ─── Test Attempts ───────────────────────────────────────
  testAttempts: defineTable({
    userId: v.id("users"),
    testId: v.id("tests"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOptionId: v.optional(v.string()),
        isCorrect: v.boolean(),
        timeSpentSeconds: v.number(),
      })
    ),
    score: v.number(),
    totalMarks: v.number(),
    accuracy: v.number(),
    timeTakenSeconds: v.number(),
    rank: v.optional(v.number()),
    percentile: v.optional(v.number()),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_test", ["testId"])
    .index("by_user_test", ["userId", "testId"]),

  // ─── Bookmarks ───────────────────────────────────────────
  bookmarks: defineTable({
    userId: v.id("users"),
    questionId: v.optional(v.id("questions")),
    testId: v.optional(v.id("tests")),
    type: v.union(v.literal("question"), v.literal("test")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ─── Study Notes ─────────────────────────────────────────
  studyNotes: defineTable({
    examId: v.id("exams"),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    isPremium: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_exam", ["examId"])
    .index("by_slug", ["slug"]),

  // ─── Current Affairs ─────────────────────────────────────
  currentAffairs: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    summary: v.string(),
    category: v.string(),
    date: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_slug", ["slug"]),

  // ─── Daily Quiz ──────────────────────────────────────────
  dailyQuizzes: defineTable({
    date: v.string(),
    testId: v.id("tests"),
    isActive: v.boolean(),
  }).index("by_date", ["date"]),

  // ─── Doubts ──────────────────────────────────────────────
  doubts: defineTable({
    userId: v.id("users"),
    questionText: v.string(),
    questionImage: v.optional(v.string()),
    answer: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("answered"),
      v.literal("closed")
    ),
    createdAt: v.number(),
    answeredAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ─── Subscriptions / Pass ────────────────────────────────
  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("lifetime")
    ),
    amount: v.number(),
    startsAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
    paymentId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // ─── Notifications ───────────────────────────────────────
  notifications: defineTable({
    userId: v.optional(v.id("users")),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─── Leaderboard ─────────────────────────────────────────
  leaderboard: defineTable({
    userId: v.id("users"),
    testId: v.id("tests"),
    score: v.number(),
    timeTakenSeconds: v.number(),
    rank: v.number(),
    updatedAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_test_rank", ["testId", "rank"]),
});
