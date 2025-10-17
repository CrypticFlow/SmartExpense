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

export const getTeamExpenses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || !user.teamId) return [];

    // Only managers and admins can view team expenses
    if (user.role === "employee") return [];

    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("teamId"), user.teamId))
      .order("desc")
      .collect();

    // Get submitter details for each expense
    const expensesWithUsers = await Promise.all(
      expenses.map(async (expense) => {
        const submitter = await ctx.db.get(expense.submittedBy);
        return {
          ...expense,
          submitterName: submitter?.name || "Unknown User",
          submitterEmail: submitter?.email || "",
        };
      })
    );

    return expensesWithUsers;
  },
});

export const getPendingExpenses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || !user.teamId) return [];

    // Only managers and admins can view pending expenses
    if (user.role === "employee") return [];

    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => 
        q.and(
          q.eq(q.field("teamId"), user.teamId),
          q.eq(q.field("status"), "pending")
        )
      )
      .order("desc")
      .collect();

    // Get submitter details for each expense
    const expensesWithUsers = await Promise.all(
      expenses.map(async (expense) => {
        const submitter = await ctx.db.get(expense.submittedBy);
        return {
          ...expense,
          submitterName: submitter?.name || "Unknown User",
          submitterEmail: submitter?.email || "",
        };
      })
    );

    return expensesWithUsers;
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

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");

    // Update expense status
    await ctx.db.patch(args.expenseId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
    });

    // Update budget spending for category-specific budgets
    const budgets = await ctx.db
      .query("budgets")
      .filter((q) => 
        q.and(
          q.eq(q.field("teamId"), expense.teamId),
          q.eq(q.field("isActive"), true),
          q.eq(q.field("category"), expense.category)
        )
      )
      .collect();

    // Update general budgets (no specific category)
    const generalBudgets = await ctx.db
      .query("budgets")
      .filter((q) => 
        q.and(
          q.eq(q.field("teamId"), expense.teamId),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    // Update category-specific budgets
    for (const budget of budgets) {
      const newSpent = (budget.spent || 0) + expense.amount;
      await ctx.db.patch(budget._id, { spent: newSpent });
      
      // Check for alerts
      await checkAndCreateBudgetAlerts(ctx, budget, newSpent);
    }

    // Update general budgets (those without specific category)
    for (const budget of generalBudgets.filter(b => !b.category)) {
      const newSpent = (budget.spent || 0) + expense.amount;
      await ctx.db.patch(budget._id, { spent: newSpent });
      
      // Check for alerts
      await checkAndCreateBudgetAlerts(ctx, budget, newSpent);
    }

    return expense;
  },
});

async function checkAndCreateBudgetAlerts(ctx: any, budget: any, newSpent: number) {
  const percentage = (newSpent / budget.amount) * 100;
  const thresholdPercentage = budget.alertThreshold;

  // Check if we already have recent alerts to avoid duplicates
  const recentAlerts = await ctx.db
    .query("budgetAlerts")
    .filter((q) => q.eq(q.field("budgetId"), budget._id))
    .order("desc")
    .take(5);

  const hasRecentThresholdAlert = recentAlerts.some((alert: any) => 
    alert.alertType === "threshold" && 
    new Date(alert.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // 24 hours
  );

  const hasRecentExceededAlert = recentAlerts.some((alert: any) => 
    alert.alertType === "exceeded" && 
    new Date(alert.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // 24 hours
  );

  if (percentage >= thresholdPercentage && percentage < 100 && !hasRecentThresholdAlert) {
    await ctx.db.insert("budgetAlerts", {
      budgetId: budget._id,
      userId: budget.createdBy,
      alertType: "threshold",
      percentage: Math.round(percentage),
      message: `Budget "${budget.name}" has reached ${Math.round(percentage)}% of its limit`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } else if (percentage >= 100 && !hasRecentExceededAlert) {
    await ctx.db.insert("budgetAlerts", {
      budgetId: budget._id,
      userId: budget.createdBy,
      alertType: "exceeded",
      percentage: Math.round(percentage),
      message: `Budget "${budget.name}" has been exceeded by ${Math.round(percentage - 100)}%`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }
}

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