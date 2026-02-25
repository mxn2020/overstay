import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Get the current authenticated user's profile
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) {
            const authUser = await ctx.db.get(userId);
            return {
                _id: userId,
                email: authUser?.email ?? "",
                name: authUser?.name ?? "",
                role: "user" as const,
                plan: "free" as const,
                hasProfile: false,
            };
        }

        const authUser = await ctx.db.get(userId);
        return {
            ...profile,
            email: authUser?.email ?? "",
            hasProfile: true,
        };
    },
});

// Create or update user profile after first login
export const ensureProfile = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!existing) {
            const authUser = await ctx.db.get(userId);
            await ctx.db.insert("userProfiles", {
                userId: userId,
                name: authUser?.name ?? "",
                role: "user",
                overstayScore: 0,
                totalPredictions: 0,
                beatTheAiWins: 0,
                streak: 0,
                plan: "free",
                createdAt: Date.now(),
            });
        }
    },
});

// Admin: list all users
export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile?.role !== "admin") return [];

        return await ctx.db.query("userProfiles").collect();
    },
});

// Admin: set user role
export const setRole = mutation({
    args: {
        profileId: v.id("userProfiles"),
        role: v.union(v.literal("user"), v.literal("admin")),
    },
    handler: async (ctx, { profileId, role }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const myProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (myProfile?.role !== "admin") throw new Error("Not authorized");

        await ctx.db.patch(profileId, { role });
    },
});
