import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("badges")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
    },
});

export const award = mutation({
    args: {
        userId: v.id("users"),
        badgeType: v.string(),
    },
    handler: async (ctx, { userId, badgeType }) => {
        // Check if badge already exists
        const existing = await ctx.db
            .query("badges")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("badgeType"), badgeType))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("badges", {
            userId,
            badgeType,
            awardedAt: Date.now(),
        });
    },
});
