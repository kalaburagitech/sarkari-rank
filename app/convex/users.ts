import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const register = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("Email already registered");

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      passwordHash: args.passwordHash,
      role: "student",
      isPremium: false,
      streak: 0,
      totalTestsTaken: 0,
      createdAt: Date.now(),
    });
  },
});

export const login = mutation({
  args: { email: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user || user.passwordHash !== args.passwordHash) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isPremium: user.isPremium,
      avatarUrl: user.avatarUrl,
      streak: user.streak,
      totalTestsTaken: user.totalTestsTaken,
    };
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      avatarUrl: user.avatarUrl,
      streak: user.streak,
      totalTestsTaken: user.totalTestsTaken,
      phone: user.phone,
    };
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(userId, filtered);
  },
});

export const createAdmin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== process.env.ADMIN_SECRET) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { role: "admin" });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: args.passwordHash,
      role: "admin",
      isPremium: true,
      streak: 0,
      totalTestsTaken: 0,
      createdAt: Date.now(),
    });
  },
});
