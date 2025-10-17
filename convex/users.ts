import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    teamId: v.id("teams"),
    role: v.optional(v.union(v.literal("admin"), v.literal("manager"), v.literal("employee"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      teamId: args.teamId,
      role: args.role || "employee",
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;

    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
  },
});

export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();
  },
});