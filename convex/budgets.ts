import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    period: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    startDate: v.string(),
    alertThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) throw new Error("User not found");

    // Calculate end date based on period
    const startDate = new Date(args.startDate);
    let endDate = new Date(startDate);
    
    switch (args.period) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "yearly":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return await ctx.db.insert("budgets", {
      name: args.name,
      amount: args.amount,
      category: args.category,
      teamId: user.teamId!,
      createdBy: user._id,
      period: args.period,
      startDate: args.startDate,
      endDate: endDate.toISOString().split('T')[0],
      alertThreshold: args.alertThreshold,
      isActive: true,
      spent: 0,
    });
  },
});

export const getByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    // Get budgets with creator information
    const budgets = await ctx.db
      .query("budgets")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .order("desc")
      .collect();

    // Add creator details
    const budgetsWithCreator = await Promise.all(
      budgets.map(async (budget) => {
        const creator = await ctx.db.get(budget.createdBy);
        return {
          ...budget,
          creatorName: creator?.name || "Unknown User",
        };
      })
    );

    return budgetsWithCreator;
  },
});

export const getActive = query({
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
      .query("budgets")
      .filter((q) => 
        q.and(
          q.eq(q.field("teamId"), user.teamId),
          q.eq(q.field("isActive"), true)
        )
      )
      .order("desc")
      .collect();
  },
});

export const updateSpent = mutation({
  args: {
    budgetId: v.id("budgets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget) throw new Error("Budget not found");

    const newSpent = (budget.spent || 0) + args.amount;
    
    await ctx.db.patch(args.budgetId, {
      spent: newSpent,
    });

    // Check if we need to create alerts
    const percentage = (newSpent / budget.amount) * 100;
    const thresholdPercentage = budget.alertThreshold;

    if (percentage >= thresholdPercentage && percentage < 100) {
      // Create threshold alert
      await ctx.db.insert("budgetAlerts", {
        budgetId: args.budgetId,
        userId: budget.createdBy,
        alertType: "threshold",
        percentage: Math.round(percentage),
        message: `Budget "${budget.name}" has reached ${Math.round(percentage)}% of its limit`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } else if (percentage >= 100) {
      // Create exceeded alert
      await ctx.db.insert("budgetAlerts", {
        budgetId: args.budgetId,
        userId: budget.createdBy,
        alertType: "exceeded",
        percentage: Math.round(percentage),
        message: `Budget "${budget.name}" has been exceeded by ${Math.round(percentage - 100)}%`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return newSpent;
  },
});

export const deactivate = mutation({
  args: { budgetId: v.id("budgets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const budget = await ctx.db.get(args.budgetId);
    if (!budget) throw new Error("Budget not found");

    if (budget.teamId !== user.teamId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.budgetId, {
      isActive: false,
    });
  },
});

export const getBudgetAlerts = query({
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
      .query("budgetAlerts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();
  },
});

export const markAlertAsRead = mutation({
  args: { alertId: v.id("budgetAlerts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) throw new Error("User not found");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    if (alert.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.alertId, {
      isRead: true,
    });
  },
});