import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee")),
    teamId: v.optional(v.id("teams")),
  }).index("by_email", ["email"]),

  teams: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
  }),

  expenses: defineTable({
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    submittedBy: v.id("users"),
    teamId: v.id("teams"),
    receiptUrl: v.optional(v.string()),
    receiptStorageId: v.optional(v.id("_storage")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["submittedBy"])
    .index("by_status", ["status"]),

  categories: defineTable({
    name: v.string(),
    teamId: v.id("teams"),
    isDefault: v.optional(v.boolean()),
  }).index("by_team", ["teamId"]),

  budgets: defineTable({
    name: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    teamId: v.id("teams"),
    createdBy: v.id("users"),
    period: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    startDate: v.string(),
    endDate: v.string(),
    alertThreshold: v.number(),
    isActive: v.boolean(),
    spent: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_team_active", ["teamId", "isActive"])
    .index("by_category", ["category"]),

  budgetAlerts: defineTable({
    budgetId: v.id("budgets"),
    userId: v.id("users"),
    alertType: v.union(v.literal("threshold"), v.literal("exceeded")),
    percentage: v.number(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_budget", ["budgetId"])
    .index("by_user_unread", ["userId", "isRead"]),

  teamInvitations: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee")),
    invitedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    inviteCode: v.string(),
    createdAt: v.string(),
    expiresAt: v.string(),
  })
    .index("by_team", ["teamId"])
    .index("by_email", ["email"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_status", ["status"]),
});