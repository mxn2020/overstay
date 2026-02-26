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

        const targetProfile = await ctx.db.get(profileId);
        const oldRole = targetProfile?.role ?? "unknown";

        await ctx.db.patch(profileId, { role });

        // Audit log
        await ctx.db.insert("auditLogs", {
            action: "admin.role_change",
            category: "admin",
            userId,
            targetId: profileId,
            details: JSON.stringify({
                message: `Changed role from ${oldRole} to ${role}`,
                oldRole,
                newRole: role,
                targetUserId: targetProfile?.userId,
            }),
            timestamp: Date.now(),
        });
    },
});

// Update user profile (name)
export const updateProfile = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, { name }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { name });
        }
    },
});

// Delete user account and all associated data
export const deleteAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Delete user profile
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile) {
            await ctx.db.delete(profile._id);
        }

        // Delete all user predictions
        const predictions = await ctx.db
            .query("predictions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        for (const prediction of predictions) {
            await ctx.db.delete(prediction._id);
        }

        // Delete all user badges
        const badges = await ctx.db
            .query("badges")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

        for (const badge of badges) {
            await ctx.db.delete(badge._id);
        }

        // Audit log
        await ctx.db.insert("auditLogs", {
            action: "user.account_deleted",
            category: "auth",
            userId,
            details: JSON.stringify({ message: "User deleted their account" }),
            timestamp: Date.now(),
        });
    },
});

// Bootstrap: promote user to admin by email (no auth check — use once then remove)
export const bootstrapAdmin = mutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        // Find user by email in auth users table
        const users = await ctx.db.query("users").collect();
        const user = users.find((u: any) => u.email === email);
        if (!user) throw new Error(`No user found with email: ${email}`);

        // Find or create their profile
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { role: "admin" });
            return { status: "updated", profileId: profile._id };
        } else {
            const id = await ctx.db.insert("userProfiles", {
                userId: user._id,
                name: user.name ?? "",
                role: "admin",
                overstayScore: 0,
                totalPredictions: 0,
                beatTheAiWins: 0,
                streak: 0,
                plan: "free",
                createdAt: Date.now(),
            });
            return { status: "created", profileId: id };
        }
    },
});
