import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get or create user first
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      // Create user without teamId first
      const userId = await ctx.db.insert("users", {
        name: identity?.name || identity?.email || "Test User",
        email: identity?.email || "test@example.com",
        role: "admin",
      });
      user = await ctx.db.get(userId);
    }

    // Create team with the actual user ID
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      createdBy: user!._id,
    });

    // Update user with the correct teamId
    await ctx.db.patch(user!._id, { teamId });

    return teamId;
  },
});

export const getMyTeam = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) return null;

    return await ctx.db.get(user.teamId);
  },
});