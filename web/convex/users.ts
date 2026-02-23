import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        const badges = await ctx.db
            .query("badges")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        return { ...user, badges };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        authProvider: v.string(),
    },
    handler: async (ctx, { name, email, authProvider }) => {
        // Check if user already exists
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("users", {
            name,
            email,
            authProvider,
            overstayScore: 0,
            totalPredictions: 0,
            beatTheAiWins: 0,
            streak: 0,
            createdAt: Date.now(),
        });
    },
});
