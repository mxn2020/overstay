import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

const CREDITS_PER_PREDICTION = 4;
const MONTHLY_ALLOWANCE = 100;

// ---- Queries ----

export const getBalance = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) return { credits: 0, plan: "free" as const };

        return {
            credits: profile.creditBalance ?? 0,
            plan: profile.plan ?? "free",
        };
    },
});

export const canPredict = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            // Anonymous user — frontend handles localStorage check
            return { allowed: true, reason: "anonymous", credits: 0 };
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) {
            return { allowed: false, reason: "no_profile", credits: 0 };
        }

        const credits = profile.creditBalance ?? 0;
        if (credits < CREDITS_PER_PREDICTION) {
            return {
                allowed: false,
                reason: "insufficient_credits",
                credits,
                needed: CREDITS_PER_PREDICTION,
            };
        }

        return { allowed: true, reason: "has_credits", credits };
    },
});

export const getTransactionHistory = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("creditTransactions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(limit ?? 50);
    },
});

// ---- Mutations ----

export const deductCredits = mutation({
    args: { description: v.optional(v.string()) },
    handler: async (ctx, { description }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) throw new Error("No profile found");

        const currentBalance = profile.creditBalance ?? 0;
        if (currentBalance < CREDITS_PER_PREDICTION) {
            throw new Error(`Insufficient credits: have ${currentBalance}, need ${CREDITS_PER_PREDICTION}`);
        }

        const newBalance = currentBalance - CREDITS_PER_PREDICTION;
        await ctx.db.patch(profile._id, { creditBalance: newBalance });

        await ctx.db.insert("creditTransactions", {
            userId,
            type: "deduct",
            amount: -CREDITS_PER_PREDICTION,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: description ?? "Prediction",
            timestamp: Date.now(),
        });

        return { credits: newBalance };
    },
});

export const refundCredits = internalMutation({
    args: { userId: v.string(), amount: v.number(), description: v.string() },
    handler: async (ctx, { userId, amount, description }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) return;

        const currentBalance = profile.creditBalance ?? 0;
        const newBalance = currentBalance + amount;
        await ctx.db.patch(profile._id, { creditBalance: newBalance });

        await ctx.db.insert("creditTransactions", {
            userId,
            type: "refund",
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description,
            timestamp: Date.now(),
        });
    },
});

// Add credits after Stripe purchase
export const addPurchasedCredits = internalMutation({
    args: {
        userId: v.string(),
        amount: v.number(),
        description: v.string(),
        stripeSessionId: v.optional(v.string()),
    },
    handler: async (ctx, { userId, amount, description, stripeSessionId }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) throw new Error("No profile found");

        const currentBalance = profile.creditBalance ?? 0;
        const newBalance = currentBalance + amount;
        await ctx.db.patch(profile._id, { creditBalance: newBalance });

        await ctx.db.insert("creditTransactions", {
            userId,
            type: "purchase",
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description,
            stripeSessionId,
            timestamp: Date.now(),
        });

        return { credits: newBalance };
    },
});

// Monthly credit refill for paid users
export const monthlyRefill = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile || profile.plan !== "paid") {
            return { refilled: false, reason: "not_paid" };
        }

        // Check if already refilled this month
        const now = Date.now();
        const lastRefill = profile.lastCreditRefill ?? 0;
        const oneMonth = 30 * 24 * 60 * 60 * 1000; // ~30 days

        if (now - lastRefill < oneMonth) {
            return { refilled: false, reason: "already_refilled" };
        }

        const currentBalance = profile.creditBalance ?? 0;
        const newBalance = currentBalance + MONTHLY_ALLOWANCE;

        await ctx.db.patch(profile._id, {
            creditBalance: newBalance,
            lastCreditRefill: now,
        });

        await ctx.db.insert("creditTransactions", {
            userId,
            type: "refill",
            amount: MONTHLY_ALLOWANCE,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: "Monthly allowance (100 credits)",
            timestamp: now,
        });

        return { refilled: true, credits: newBalance };
    },
});

// Admin: grant bonus credits
export const grantCredits = mutation({
    args: {
        targetProfileId: v.id("userProfiles"),
        amount: v.number(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, { targetProfileId, amount, description }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const myProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (myProfile?.role !== "admin") throw new Error("Not authorized");

        const target = await ctx.db.get(targetProfileId);
        if (!target) throw new Error("Target profile not found");

        const currentBalance = target.creditBalance ?? 0;
        const newBalance = currentBalance + amount;
        await ctx.db.patch(targetProfileId, { creditBalance: newBalance });

        await ctx.db.insert("creditTransactions", {
            userId: target.userId,
            type: "bonus",
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: description ?? `Admin grant by ${userId}`,
            timestamp: Date.now(),
        });

        return { credits: newBalance };
    },
});

// Admin: get all credit stats
export const getCreditStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile?.role !== "admin") return null;

        const recent = await ctx.db
            .query("creditTransactions")
            .withIndex("by_timestamp")
            .order("desc")
            .take(200);

        let totalDeducted = 0;
        let totalPurchased = 0;
        let totalRefilled = 0;

        for (const tx of recent) {
            if (tx.type === "deduct") totalDeducted += Math.abs(tx.amount);
            if (tx.type === "purchase") totalPurchased += tx.amount;
            if (tx.type === "refill") totalRefilled += tx.amount;
        }

        return { totalDeducted, totalPurchased, totalRefilled, recentCount: recent.length };
    },
});
