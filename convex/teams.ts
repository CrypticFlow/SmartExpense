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

export const inviteTeamMember = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      throw new Error("Only admins and managers can invite team members");
    }

    // Check if user is already a team member
    const existingMember = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingMember && existingMember.teamId === user.teamId) {
      throw new Error("User is already a team member");
    }

    // Check if invitation already exists
    const existingInvitation = await ctx.db
      .query("teamInvitations")
      .filter((q) => 
        q.and(
          q.eq(q.field("email"), args.email),
          q.eq(q.field("teamId"), user.teamId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingInvitation) {
      throw new Error("Invitation already sent to this email");
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    return await ctx.db.insert("teamInvitations", {
      teamId: user.teamId!,
      email: args.email,
      role: args.role,
      invitedBy: user._id,
      status: "pending",
      inviteCode,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  },
});

export const acceptInvitation = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Find the invitation
    const invitation = await ctx.db
      .query("teamInvitations")
      .filter((q) => 
        q.and(
          q.eq(q.field("inviteCode"), args.inviteCode),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      await ctx.db.patch(invitation._id, { status: "declined" });
      throw new Error("Invitation has expired");
    }

    // Check if email matches
    if (invitation.email !== identity.email) {
      throw new Error("Invitation email does not match your account");
    }

    // Get or create user
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user) {
      // Create new user
      const userId = await ctx.db.insert("users", {
        name: identity.name || identity.email || "Team Member",
        email: identity.email || invitation.email,
        teamId: invitation.teamId,
        role: invitation.role,
      });
      user = await ctx.db.get(userId);
    } else {
      // Update existing user
      await ctx.db.patch(user._id, {
        teamId: invitation.teamId,
        role: invitation.role,
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, { status: "accepted" });

    return user;
  },
});

export const getTeamInvitations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || !user.teamId) return [];

    return await ctx.db
      .query("teamInvitations")
      .filter((q) => q.eq(q.field("teamId"), user.teamId))
      .order("desc")
      .collect();
  },
});

export const cancelInvitation = mutation({
  args: { invitationId: v.id("teamInvitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      throw new Error("Only admins and managers can cancel invitations");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.teamId !== user.teamId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.invitationId, { status: "declined" });
  },
});

export const removeTeamMember = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can remove team members");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    if (targetUser.teamId !== currentUser.teamId) {
      throw new Error("User is not in your team");
    }

    if (targetUser._id === currentUser._id) {
      throw new Error("Cannot remove yourself from the team");
    }

    // Remove user from team (you might want to create a separate "removed" team or handle this differently)
    return await ctx.db.delete(args.userId);
  },
});

export const updateMemberRole = mutation({
  args: { 
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update member roles");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    if (targetUser.teamId !== currentUser.teamId) {
      throw new Error("User is not in your team");
    }

    return await ctx.db.patch(args.userId, { role: args.role });
  },
});