import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logAudit = mutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
