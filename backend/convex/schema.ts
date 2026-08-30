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
    // "karnataka" bodies sort above "national" ones; existing rows read as national.
    region: v.optional(v.union(v.literal("karnataka"), v.literal("national"))),
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
    // Rich exam metadata (all optional → backward compatible)
    conductingBody: v.optional(v.string()),
    officialWebsite: v.optional(v.string()),
    eligibility: v.optional(v.string()),
    posts: v.optional(v.array(v.string())),
    examPattern: v.optional(v.string()),
    syllabus: v.optional(v.string()),
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
    // Exam year for Previous Year Papers (type = "pyp"). Optional → existing rows valid.
    year: v.optional(v.number()),
    languages: v.array(v.string()),
    // Primary language of THIS paper (per-language papers). Optional → falls
    // back to languages[0]/"English". Lets one exam have the same paper in
    // multiple languages as separate test docs.
    language: v.optional(v.string()),
    // Shared key linking the language versions of the same paper together so
    // the app can group them and offer a language switch.
    paperGroup: v.optional(v.string()),
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
    // Kannada mirror fields for bilingual rendering (optional → English-only rows still valid)
    questionTextKn: v.optional(v.string()),
    optionsKn: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
        })
      )
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
    // Draft/Published status for admin content workflow. Absent → treated as published.
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
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
    // Markdown body. Optional now — a note can be a PDF-only chapter.
    content: v.optional(v.string()),
    // Short summary shown in listings (optional → existing rows valid).
    summary: v.optional(v.string()),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    // Language of this note version (English/Kannada/Hindi/...). Optional →
    // existing rows default to English at read time.
    language: v.optional(v.string()),
    // Uploaded PDF (Convex file storage). When present the app renders the PDF.
    pdfStorageId: v.optional(v.id("_storage")),
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
    // Original source link + publisher (Play "Misleading Claims" compliance —
    // government/news info must link to its source). Optional → old rows valid.
    sourceUrl: v.optional(v.string()),
    sourceName: v.optional(v.string()),
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

  // ─── Practice Bank (Subject → Chapter → Questions) ───────
  // A global practice question bank organised purely by Subject → Chapter,
  // independent of any exam. One subject has many chapters; one chapter has
  // many questions. Used by the app's "Practice by Subject" experience.
  subjects: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // Ionicon name (e.g. "book") or emoji
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  chapters: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_subject", ["subjectId"])
    .index("by_subject_slug", ["subjectId", "slug"]),

  practiceQuestions: defineTable({
    chapterId: v.id("chapters"),
    subjectId: v.id("subjects"), // denormalised for subject-wide queries
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
    questionTextKn: v.optional(v.string()),
    optionsKn: v.optional(
      v.array(v.object({ id: v.string(), text: v.string() }))
    ),
    explanationKn: v.optional(v.string()),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    marks: v.number(),
    negativeMarks: v.number(),
    order: v.number(),
    language: v.string(),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    createdAt: v.number(),
  })
    .index("by_chapter", ["chapterId"])
    .index("by_chapter_order", ["chapterId", "order"])
    .index("by_subject", ["subjectId"]),
});
