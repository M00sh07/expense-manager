import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* ───────────────── CREATE EXPENSE ───────────────── */

export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");

      const isMember = group.members.some(
        (m) => m.userId === user._id
      );
      if (!isMember) {
        throw new Error("You are not a member of this group");
      }
    }

    const totalSplitAmount = args.splits.reduce(
      (sum, s) => sum + s.amount,
      0
    );

    if (Math.abs(totalSplitAmount - args.amount) > 0.01) {
      throw new Error("Split amounts must add up to total");
    }

    return await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: user._id,
    });
  },
});

/* ───────────────── GET EXPENSES BETWEEN USERS ───────────────── */

export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (me._id === userId) throw new Error("Cannot query yourself");

    /* ───── 1. Expenses paid by either user (existing behavior) ───── */
    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", me._id)
      )
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId)
      )
      .collect();

    /* ───── 2. ADD: Group expenses where BOTH are in splits ───── */
    const sharedGroupExpenses = (await ctx.db.query("expenses").collect()).filter(
      (e) =>
        e.groupId &&
        e.splits.some((s) => s.userId === me._id) &&
        e.splits.some((s) => s.userId === userId)
    );

    /* ───── 3. Merge & de-duplicate ───── */
    const expenseMap = new Map();
    [...myPaid, ...theirPaid, ...sharedGroupExpenses].forEach((e) =>
      expenseMap.set(e._id, e)
    );

    const expenses = Array.from(expenseMap.values()).sort(
      (a, b) => b.date - a.date
    );

    /* ───── 4. Settlements (UNCHANGED) ───── */
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("paidByUserId"), me._id),
            q.eq(q.field("receivedByUserId"), userId)
          ),
          q.and(
            q.eq(q.field("paidByUserId"), userId),
            q.eq(q.field("receivedByUserId"), me._id)
          )
        )
      )
      .collect();

    settlements.sort((a, b) => b.date - a.date);

    /* ───── 5. Balance calculation (UNCHANGED) ───── */
    let balance = 0;

    for (const e of expenses) {
      if (e.paidByUserId === me._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount;
      } else {
        const split = e.splits.find((s) => s.userId === me._id && !s.paid);
        if (split) balance -= split.amount;
      }
    }

    for (const s of settlements) {
      if (s.paidByUserId === me._id) balance += s.amount;
      else balance -= s.amount;
    }

    /* ───── 6. Return ───── */
    const other = await ctx.db.get(userId);
    if (!other) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});


/* ───────────────── DELETE EXPENSE ───────────────── */

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    const expense = await ctx.db.get(args.expenseId);

    if (!expense) throw new Error("Expense not found");

    if (
      expense.createdBy !== user._id &&
      expense.paidByUserId !== user._id
    ) {
      throw new Error("Not authorized");
    }

    const allSettlements = await ctx.db
      .query("settlements")
      .collect();

    const related = allSettlements.filter(
      (s) =>
        s.relatedExpenseIds?.includes(args.expenseId)
    );

    for (const s of related) {
      const updated = s.relatedExpenseIds.filter(
        (id) => id !== args.expenseId
      );

      if (updated.length === 0) {
        await ctx.db.delete(s._id);
      } else {
        await ctx.db.patch(s._id, {
          relatedExpenseIds: updated,
        });
      }
    }

    await ctx.db.delete(args.expenseId);
    return { success: true };
  },
});
