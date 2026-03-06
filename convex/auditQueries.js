import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all audit logs (latest first)
 */
export const getAllAudits = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("auditLogs")
      .order("desc")
      .collect();
  },
});

/**
 * Get audit logs for a specific group
 */
export const getGroupAudits = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, { groupId }) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
      .order("desc")
      .collect();
  },
});

/**
 * Get audit logs performed by a specific user
 */
export const getUserAudits = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Get recent audit logs (limit)
 */
export const getRecentAudits = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(limit);
  },
});
