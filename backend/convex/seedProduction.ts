import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  QUESTION_BANK,
  makeQuestion,
  TEST_TEMPLATES,
  STUDY_NOTES_DATA,
  CURRENT_AFFAIRS_DATA,
  TEST_SERIES_DATA,
} from "./questionBank";

type TestType = "mock" | "live" | "chapter" | "subject" | "pyp" | "daily" | "practice";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export const seedProductionData = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const existingTests = await ctx.db.query("tests").collect();
    if (existingTests.length >= 50 && !args.force) {
      return {
        message: `Already has ${existingTests.length} tests. Use force:true to add more.`,
        totalTests: existingTests.length,
      };
    }

    let testsCreated = 0;
    let questionsCreated = 0;

    const exams = await ctx.db.query("exams").collect();
    if (exams.length === 0) {
      return { message: "No exams found. Run basic seed first from Dashboard." };
    }

    const examMap: Record<string, (typeof exams)[0]> = {};
    for (const e of exams) examMap[e.slug] = e;

    // Test series
    for (const series of TEST_SERIES_DATA) {
      const exam = examMap[series.exam];
      if (!exam) continue;
      const slug = slugify(series.title);
      const exists = await ctx.db.query("testSeries").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      if (exists) continue;
      await ctx.db.insert("testSeries", {
        examId: exam._id,
        title: series.title,
        slug,
        description: series.description,
        totalTests: 0,
        totalQuestions: 0,
        isFree: false,
        isPremium: true,
        price: series.price,
        languages: ["English", "Hindi"],
        tags: series.tags,
        isActive: true,
        createdAt: Date.now(),
      });
    }

    let qIndex = 0;
    for (const template of TEST_TEMPLATES) {
      const exam = examMap[template.exam];
      if (!exam) continue;

      for (let i = 0; i < template.types.length; i++) {
        const type = template.types[i] as TestType;
        const num = i + 1;
        const typeLabel =
          type === "pyp" ? "Previous Year Paper"
          : type === "mock" ? "Mock Test"
          : `${type.charAt(0).toUpperCase()}${type.slice(1)} Test`;
        const title = `${template.prefix} ${typeLabel} ${num}`;
        const slug = slugify(title);

        const exists = await ctx.db.query("tests").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
        if (exists) continue;

        const durationMap: Record<string, number> = {
          mock: 60, live: 90, chapter: 30, subject: 45, pyp: 120, daily: 15, practice: 20,
        };
        const qCount = type === "daily" || type === "practice" ? 5 : 10;

        const testId = await ctx.db.insert("tests", {
          examId: exam._id,
          title,
          slug,
          description: `${typeLabel} for ${exam.name} — latest exam pattern with solutions`,
          type,
          durationMinutes: durationMap[type] ?? 60,
          totalQuestions: qCount,
          totalMarks: qCount * 2,
          negativeMarking: 0.5,
          languages: ["English", "Hindi"],
          isFree: i < 2,
          isPremium: i >= 2,
          isActive: true,
          attemptCount: Math.floor(Math.random() * 5000) + 100,
          createdAt: Date.now(),
        });

        for (let j = 0; j < qCount; j++) {
          const q = QUESTION_BANK[qIndex % QUESTION_BANK.length];
          qIndex++;
          await ctx.db.insert("questions", { testId, ...makeQuestion(q, j + 1) });
          questionsCreated++;
        }

        const freshExam = await ctx.db.get(exam._id);
        if (freshExam) await ctx.db.patch(exam._id, { totalTests: freshExam.totalTests + 1 });
        testsCreated++;
      }
    }

    // Bonus tests to reach 55+
    const extraExams = ["ssc-cgl", "ibps-po", "rrb-ntpc", "upsc-prelims", "ssc-chsl"];
    let extraNum = 1;
    while ((await ctx.db.query("tests").collect()).length < 55) {
      let added = false;
      for (const examSlug of extraExams) {
        if ((await ctx.db.query("tests").collect()).length >= 55) break;
        const exam = examMap[examSlug];
        if (!exam) continue;
        const title = `${exam.name} Bonus Mock Test ${extraNum}`;
        const slug = slugify(title);
        const exists = await ctx.db.query("tests").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
        if (exists) continue;

        const testId = await ctx.db.insert("tests", {
          examId: exam._id,
          title,
          slug,
          description: `Full-length bonus mock for ${exam.name}`,
          type: "mock",
          durationMinutes: 60,
          totalQuestions: 10,
          totalMarks: 20,
          negativeMarking: 0.5,
          languages: ["English", "Hindi"],
          isFree: extraNum % 3 === 0,
          isPremium: extraNum % 3 !== 0,
          isActive: true,
          attemptCount: Math.floor(Math.random() * 3000) + 50,
          createdAt: Date.now(),
        });

        for (let j = 0; j < 10; j++) {
          const q = QUESTION_BANK[qIndex % QUESTION_BANK.length];
          qIndex++;
          await ctx.db.insert("questions", { testId, ...makeQuestion(q, j + 1) });
          questionsCreated++;
        }
        const freshExam = await ctx.db.get(exam._id);
        if (freshExam) await ctx.db.patch(exam._id, { totalTests: freshExam.totalTests + 1 });
        testsCreated++;
        added = true;
      }
      extraNum++;
      if (!added || extraNum > 25) break;
    }

    // Study notes
    for (const note of STUDY_NOTES_DATA) {
      const exam = examMap[note.exam];
      if (!exam) continue;
      const slug = slugify(note.title);
      const exists = await ctx.db.query("studyNotes").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      if (exists) continue;
      await ctx.db.insert("studyNotes", {
        examId: exam._id,
        title: note.title,
        slug,
        content: note.content,
        subject: note.subject,
        topic: note.topic,
        isPremium: false,
        isActive: true,
        createdAt: Date.now(),
      });
    }

    // Current affairs
    for (const affair of CURRENT_AFFAIRS_DATA) {
      const slug = slugify(affair.title);
      const exists = await ctx.db.query("currentAffairs").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
      if (exists) continue;
      await ctx.db.insert("currentAffairs", {
        title: affair.title,
        slug,
        summary: affair.summary,
        content: affair.content,
        category: affair.category,
        date: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: Date.now(),
      });
    }

    // Daily quiz
    const allTests = await ctx.db.query("tests").collect();
    const dailyTest = allTests.find((t) => t.type === "daily") ?? allTests[0];
    if (dailyTest) {
      const today = new Date().toISOString().split("T")[0];
      const existing = await ctx.db.query("dailyQuizzes").withIndex("by_date", (q) => q.eq("date", today)).first();
      if (!existing) {
        await ctx.db.insert("dailyQuizzes", { date: today, testId: dailyTest._id, isActive: true });
      }
    }

    // Broadcast notifications for demo
    const existingNotifs = await ctx.db.query("notifications").collect();
    if (existingNotifs.length < 5) {
      const notifs = [
        { title: "🎯 New Mock Tests Live", body: "55+ full mock tests added for SSC, Banking & Railway!", type: "test" },
        { title: "📅 Daily Quiz Ready", body: "Today's daily quiz is live. Attempt now to maintain your streak!", type: "quiz" },
        { title: "📰 Current Affairs Updated", body: "10 new current affairs articles added for exam prep.", type: "ca" },
        { title: "🏆 Leaderboard Updated", body: "Check your All India Rank after completing mock tests.", type: "leaderboard" },
        { title: "⭐ Premium Pass Offer", body: "Get unlimited tests at ₹499/year — limited time offer!", type: "premium" },
      ];
      for (const n of notifs) {
        await ctx.db.insert("notifications", { ...n, isRead: false, createdAt: Date.now() - Math.floor(Math.random() * 86400000) });
      }
    }

    const totalTests = (await ctx.db.query("tests").collect()).length;
    const totalQuestions = (await ctx.db.query("questions").collect()).length;

    return {
      message: `✅ Production data loaded! +${testsCreated} tests, +${questionsCreated} questions. Total: ${totalTests} tests, ${totalQuestions} questions.`,
      testsCreated,
      questionsCreated,
      totalTests,
      totalQuestions,
    };
  },
});
