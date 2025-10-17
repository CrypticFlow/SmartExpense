import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.string(),
    teamId: v.id("teams"),
    receiptStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get or create user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("expenses", {
      ...args,
      status: "pending",
      submittedBy: user._id,
    });
  },
});

export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .order("desc")
      .collect();
  },
});

export const getMyExpenses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("submittedBy"), user._id))
      .order("desc")
      .collect();
  },
});

export const approve = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.expenseId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: new Date().toISOString(),
    });
  },
});

export const reject = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.expenseId, {
      status: "rejected",
      approvedBy: user._id,
      approvedAt: new Date().toISOString(),
    });
  },
});