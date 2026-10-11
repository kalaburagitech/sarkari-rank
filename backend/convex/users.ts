import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

// Clients send the plain password in the (historically named) `passwordHash`
// arg over HTTPS; only a bcrypt hash is stored. Rows saved before hashing hold
// the plain text and are upgraded to a hash on their next successful login.
// Salts only need to be unique, not secret: if the runtime has no WebCrypto,
// fall back to Convex's per-mutation Math.random rather than failing sign-up.
bcrypt.setRandomFallback((n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 256)));
const isBcrypt = (s: string) => /^\$2[aby]\$\d{2}\$/.test(s);
const hash = (plain: string) => bcrypt.hashSync(plain, 10);
const matches = (plain: string, stored: string) =>
  isBcrypt(stored) ? bcrypt.compareSync(plain, stored) : plain === stored;

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
      passwordHash: hash(args.passwordHash),
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
    if (!user || !user.passwordHash || !matches(args.passwordHash, user.passwordHash)) return null;
    if (!isBcrypt(user.passwordHash)) await ctx.db.patch(user._id, { passwordHash: hash(args.passwordHash) });
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
      passwordHash: hash(args.passwordHash),
      role: "admin",
      isPremium: true,
      streak: 0,
      totalTestsTaken: 0,
      createdAt: Date.now(),
    });
  },
});
