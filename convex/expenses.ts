import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.string(),
    teamId: v.optional(v.id("teams")),
    receiptStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get or create user
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    // Create user and team if they don't exist
    if (!user) {
      // Create user first with a temporary team
      const userId = await ctx.db.insert("users", {
        name: identity.name || identity.email || "Unknown User",
        email: identity.email || "unknown@example.com",
        teamId: "temp" as any, // Temporary placeholder
        role: "admin",
      });

      // Create team with the real user ID
      const teamId = await ctx.db.insert("teams", {
        name: `${identity.name || identity.email}'s Team`,
        createdBy: userId,
      });

      // Update user with correct teamId
      await ctx.db.patch(userId, { teamId });

      user = await ctx.db.get(userId);
    }

    return await ctx.db.insert("expenses", {
      amount: args.amount,
      description: args.description,
      category: args.category,
      date: args.date,
      teamId: args.teamId || user!.teamId,
      receiptStorageId: args.receiptStorageId,
      status: "pending",
      submittedBy: user!._id,
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
      approvedAt: Date.now(),
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
      approvedAt: Date.now(),
    });
  },
});