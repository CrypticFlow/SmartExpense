import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("employee")),
    teamId: v.id("teams"),
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
});