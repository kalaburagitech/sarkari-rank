import { mutation } from "./_generated/server";

/** Bootstrap seed: categories, exams, admin only. Questions come from admin or seedProduction. */
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("examCategories").first();
    if (existing) return { message: "Already seeded" };

    const categories = [
      { name: "SSC Exams", slug: "ssc", description: "Staff Selection Commission exams including CGL, CHSL, MTS, GD", icon: "📋", color: "#3B82F6", isPopular: true, order: 1 },
      { name: "Banking Exams", slug: "banking", description: "IBPS PO, Clerk, SBI PO, RBI Grade B and more", icon: "🏦", color: "#10B981", isPopular: true, order: 2 },
      { name: "Railway Exams", slug: "railway", description: "RRB NTPC, Group D, ALP, JE and more", icon: "🚂", color: "#F59E0B", isPopular: true, order: 3 },
      { name: "Teaching Exams", slug: "teaching", description: "CTET, UPTET, KVS, DSSSB Teacher exams", icon: "👨‍🏫", color: "#8B5CF6", isPopular: true, order: 4 },
      { name: "Defence Exams", slug: "defence", description: "NDA, CDS, AFCAT, CAPF and more", icon: "🎖️", color: "#EF4444", isPopular: false, order: 5 },
      { name: "State PSC", slug: "state-psc", description: "UPPSC, BPSC, MPSC and state level exams", icon: "🏛️", color: "#06B6D4", isPopular: false, order: 6 },
      { name: "UPSC & Civil Services", slug: "upsc", description: "IAS, IPS, IFS Prelims and Mains", icon: "📚", color: "#EC4899", isPopular: true, order: 7 },
      { name: "Insurance Exams", slug: "insurance", description: "LIC AAO, NIACL, UIIC exams", icon: "🛡️", color: "#14B8A6", isPopular: false, order: 8 },
    ];

    const categoryIds: Record<string, string> = {};
    for (const cat of categories) {
      const id = await ctx.db.insert("examCategories", { ...cat, isActive: true });
      categoryIds[cat.slug] = id;
    }

    const exams = [
      { categoryId: categoryIds["ssc"], name: "SSC CGL", slug: "ssc-cgl", description: "Combined Graduate Level Examination", order: 1 },
      { categoryId: categoryIds["ssc"], name: "SSC CHSL", slug: "ssc-chsl", description: "Combined Higher Secondary Level", order: 2 },
      { categoryId: categoryIds["ssc"], name: "SSC MTS", slug: "ssc-mts", description: "Multi Tasking Staff", order: 3 },
      { categoryId: categoryIds["banking"], name: "IBPS PO", slug: "ibps-po", description: "Probationary Officer", order: 1 },
      { categoryId: categoryIds["banking"], name: "SBI PO", slug: "sbi-po", description: "State Bank PO", order: 2 },
      { categoryId: categoryIds["railway"], name: "RRB NTPC", slug: "rrb-ntpc", description: "Non-Technical Popular Categories", order: 1 },
      { categoryId: categoryIds["railway"], name: "RRB Group D", slug: "rrb-group-d", description: "Group D Level 1", order: 2 },
      { categoryId: categoryIds["teaching"], name: "CTET", slug: "ctet", description: "Central Teacher Eligibility Test", order: 1 },
      { categoryId: categoryIds["upsc"], name: "UPSC Prelims", slug: "upsc-prelims", description: "Civil Services Preliminary Exam", order: 1 },
    ];

    for (const exam of exams) {
      await ctx.db.insert("exams", {
        categoryId: exam.categoryId as any,
        name: exam.name,
        slug: exam.slug,
        description: exam.description,
        totalTests: 0,
        isActive: true,
        order: exam.order,
      });
    }

    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@sarkarirank.com"))
      .first();

    if (!existingAdmin) {
      await ctx.db.insert("users", {
        email: "admin@sarkarirank.com",
        name: "Admin",
        passwordHash: "admin123",
        role: "admin",
        isPremium: true,
        streak: 0,
        totalTestsTaken: 0,
        createdAt: Date.now(),
      });
    }

    return {
      message: "Database structure seeded. Click 'Load 55+ Tests' to add questions from admin dashboard.",
    };
  },
});
