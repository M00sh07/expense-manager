import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logAudit = mutation({
  args: {
    action: v.string(),
    userId: v.string(),
    groupId: v.optional(v.id("groups")),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
