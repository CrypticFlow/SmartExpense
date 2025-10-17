import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Create user first if doesn't exist
    let user = null;
    if (identity?.email) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), identity.email))
        .first();
    }

    // Create team
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      createdBy: user?._id || "temp",
    });

    // Create or update user with team
    if (!user) {
      const userId = await ctx.db.insert("users", {
        name: identity?.name || identity?.email || "Test User",
        email: identity?.email || "test@example.com",
        teamId,
        role: "admin",
      });
      
      // Update team with correct createdBy
      await ctx.db.patch(teamId, { createdBy: userId });
    } else {
      await ctx.db.patch(user._id, { teamId, role: "admin" });
      await ctx.db.patch(teamId, { createdBy: user._id });
    }

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