import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// ─── Practice Bank: Subject → Chapter → Questions ──────────────────────────
// A global practice question bank organised purely by Subject and Chapter,
// independent of any exam. Admin creates subjects & chapters and files
// questions (single or bulk JSON) under a chapter; the app browses the tree
// and runs a chapter as an untimed practice set.

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "") || `item-${Date.now()}`;

const questionFields = {
  questionText: v.string(),
  questionImage: v.optional(v.string()),
  options: v.array(
    v.object({ id: v.string(), text: v.string(), image: v.optional(v.string()) })
  ),
  correctOptionId: v.string(),
  explanation: v.optional(v.string()),
  questionTextKn: v.optional(v.string()),
  optionsKn: v.optional(
    v.array(v.object({ id: v.string(), text: v.string() }))
  ),
  explanationKn: v.optional(v.string()),
  difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  marks: v.number(),
  negativeMarks: v.number(),
  language: v.string(),
  status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
};

// ═══ SUBJECTS ══════════════════════════════════════════════════════════════

export const listSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    subjects.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    // Attach chapter & question counts (small scale — a couple of scans).
    const withCounts = await Promise.all(
      subjects.map(async (s) => {
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("by_subject", (q) => q.eq("subjectId", s._id))
          .collect();
        const questions = await ctx.db
          .query("practiceQuestions")
          .withIndex("by_subject", (q) => q.eq("subjectId", s._id))
          .collect();
        return {
          ...s,
          chapterCount: chapters.length,
          questionCount: questions.length,
        };
      })
    );
    return withCounts;
  },
});

export const createSubject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Subject name is required");
    let slug = slugify(name);
    // Ensure slug uniqueness.
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
    const all = await ctx.db.query("subjects").collect();
    const order = all.reduce((m, s) => Math.max(m, s.order), 0) + 1;
    return await ctx.db.insert("subjects", {
      name,
      slug,
      description: args.description?.trim() || undefined,
      icon: args.icon?.trim() || undefined,
      order,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updateSubject = mutation({
  args: {
    id: v.id("subjects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Partial<Doc<"subjects">> = {};
    if (rest.name !== undefined) patch.name = rest.name.trim();
    if (rest.description !== undefined)
      patch.description = rest.description.trim() || undefined;
    if (rest.icon !== undefined) patch.icon = rest.icon.trim() || undefined;
    if (rest.order !== undefined) patch.order = rest.order;
    if (rest.isActive !== undefined) patch.isActive = rest.isActive;
    await ctx.db.patch(id, patch);
  },
});

// Cascade delete: remove the subject, its chapters, and all their questions.
export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("practiceQuestions")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .collect();
    for (const q of questions) await ctx.db.delete(q._id);
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .collect();
    for (const c of chapters) await ctx.db.delete(c._id);
    await ctx.db.delete(args.id);
  },
});

// ═══ CHAPTERS ══════════════════════════════════════════════════════════════

export const listChapters = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
    chapters.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    return await Promise.all(
      chapters.map(async (c) => {
        const questions = await ctx.db
          .query("practiceQuestions")
          .withIndex("by_chapter", (q) => q.eq("chapterId", c._id))
          .collect();
        return {
          ...c,
          questionCount: questions.length,
          publishedCount: questions.filter(
            (q) => (q.status ?? "published") === "published"
          ).length,
        };
      })
    );
  },
});

export const createChapter = mutation({
  args: {
    subjectId: v.id("subjects"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Chapter name is required");
    const subject = await ctx.db.get(args.subjectId);
    if (!subject) throw new Error("Subject not found");
    let slug = slugify(name);
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", args.subjectId).eq("slug", slug)
      )
      .first();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
    const siblings = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();
    const order = siblings.reduce((m, c) => Math.max(m, c.order), 0) + 1;
    return await ctx.db.insert("chapters", {
      subjectId: args.subjectId,
      name,
      slug,
      description: args.description?.trim() || undefined,
      order,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const updateChapter = mutation({
  args: {
    id: v.id("chapters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Partial<Doc<"chapters">> = {};
    if (rest.name !== undefined) patch.name = rest.name.trim();
    if (rest.description !== undefined)
      patch.description = rest.description.trim() || undefined;
    if (rest.order !== undefined) patch.order = rest.order;
    if (rest.isActive !== undefined) patch.isActive = rest.isActive;
    await ctx.db.patch(id, patch);
  },
});

export const deleteChapter = mutation({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("practiceQuestions")
      .withIndex("by_chapter", (q) => q.eq("chapterId", args.id))
      .collect();
    for (const q of questions) await ctx.db.delete(q._id);
    await ctx.db.delete(args.id);
  },
});

// ═══ QUESTIONS ═════════════════════════════════════════════════════════════

// Admin: every question in a chapter (drafts included), in order.
export const listChapterQuestions = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("practiceQuestions")
      .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.chapterId))
      .collect();
    return questions.sort((a, b) => a.order - b.order);
  },
});

async function nextOrder(
  ctx: QueryCtx,
  chapterId: Id<"chapters">
): Promise<number> {
  const siblings = await ctx.db
    .query("practiceQuestions")
    .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
    .collect();
  return siblings.reduce((m, q) => Math.max(m, q.order), 0) + 1;
}

export const addPracticeQuestion = mutation({
  args: { chapterId: v.id("chapters"), ...questionFields },
  handler: async (ctx, args) => {
    const { chapterId, ...q } = args;
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) throw new Error("Chapter not found");
    const order = await nextOrder(ctx, chapterId);
    return await ctx.db.insert("practiceQuestions", {
      chapterId,
      subjectId: chapter.subjectId,
      ...q,
      status: q.status ?? "published",
      order,
      createdAt: Date.now(),
    });
  },
});

export const updatePracticeQuestion = mutation({
  args: {
    id: v.id("practiceQuestions"),
    questionText: v.optional(v.string()),
    options: v.optional(
      v.array(
        v.object({ id: v.string(), text: v.string(), image: v.optional(v.string()) })
      )
    ),
    correctOptionId: v.optional(v.string()),
    explanation: v.optional(v.string()),
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
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deletePracticeQuestion = mutation({
  args: { id: v.id("practiceQuestions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Bulk JSON import into a chapter — questions are appended in order.
export const bulkImportPracticeQuestions = mutation({
  args: {
    chapterId: v.id("chapters"),
    questions: v.array(
      v.object({
        ...questionFields,
        topic: v.optional(v.string()), // accepted & ignored (chapter is the topic)
      })
    ),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) throw new Error("Chapter not found");
    let order = await nextOrder(ctx, args.chapterId);
    const ids = [];
    for (const raw of args.questions) {
      // `topic` is accepted for JSON compatibility but the chapter IS the topic,
      // so it is dropped before insert (the schema has no topic column).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { topic: _topic, ...q } = raw;
      const id = await ctx.db.insert("practiceQuestions", {
        chapterId: args.chapterId,
        subjectId: chapter.subjectId,
        ...q,
        status: q.status ?? "published",
        order,
        createdAt: Date.now(),
      });
      ids.push(id);
      order += 1;
    }
    return ids;
  },
});

// ═══ PUBLIC (app) ══════════════════════════════════════════════════════════

// The full browse tree: active subjects → active chapters, each with a count of
// published questions. Chapters with zero published questions are hidden.
export const getPracticeTree = query({
  args: {},
  handler: async (ctx) => {
    const subjects = (await ctx.db.query("subjects").collect())
      .filter((s) => s.isActive)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

    const tree = await Promise.all(
      subjects.map(async (s) => {
        const chapters = (
          await ctx.db
            .query("chapters")
            .withIndex("by_subject", (q) => q.eq("subjectId", s._id))
            .collect()
        )
          .filter((c) => c.isActive)
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

        const chaptersWithCounts = await Promise.all(
          chapters.map(async (c) => {
            const qs = await ctx.db
              .query("practiceQuestions")
              .withIndex("by_chapter", (q) => q.eq("chapterId", c._id))
              .collect();
            const publishedCount = qs.filter(
              (q) => (q.status ?? "published") === "published"
            ).length;
            return {
              _id: c._id,
              name: c.name,
              slug: c.slug,
              description: c.description,
              questionCount: publishedCount,
            };
          })
        );

        const visibleChapters = chaptersWithCounts.filter(
          (c) => c.questionCount > 0
        );
        return {
          _id: s._id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          icon: s.icon,
          chapters: visibleChapters,
          questionCount: visibleChapters.reduce(
            (sum, c) => sum + c.questionCount,
            0
          ),
        };
      })
    );

    // Only surface subjects that actually have practisable questions.
    return tree.filter((s) => s.chapters.length > 0);
  },
});

// Published questions for a chapter, ready to run as a practice set.
export const getChapterPractice = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;
    const subject = await ctx.db.get(chapter.subjectId);
    const questions = (
      await ctx.db
        .query("practiceQuestions")
        .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.chapterId))
        .collect()
    )
      .filter((q) => (q.status ?? "published") === "published")
      .sort((a, b) => a.order - b.order);
    return {
      chapter: { _id: chapter._id, name: chapter.name, slug: chapter.slug },
      subject: subject ? { _id: subject._id, name: subject.name } : null,
      questions,
    };
  },
});
