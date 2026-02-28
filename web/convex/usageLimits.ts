import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Plan limits configuration.
 * Free: 5 predictions/mo. Paid: unlimited.
 */
const PLAN_LIMITS = {
    free: { monthlyPredictions: 5 },
    paid: { monthlyPredictions: Infinity },
} as const;

type PlanType = keyof typeof PLAN_LIMITS;

function getMonthStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/**
 * Check if the user can make a prediction and increment usage.
 */
export const checkAndIncrementUsage = internalMutation({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) throw new Error("User profile not found");

        const plan = (profile.plan ?? "free") as PlanType;
        const limits = PLAN_LIMITS[plan];

        const monthStart = getMonthStart();
        const needsReset = !profile.lastCreditRefill || profile.lastCreditRefill < monthStart;

        const currentPredictions = needsReset ? 0 : (profile.totalPredictions ?? 0);

        if (currentPredictions >= limits.monthlyPredictions) {
            throw new Error(
                `You've reached your monthly limit of ${limits.monthlyPredictions} predictions on the ${plan} plan. Upgrade to continue!`
            );
        }

        await ctx.db.patch(profile._id, {
            totalPredictions: currentPredictions + 1,
            ...(needsReset ? { lastCreditRefill: Date.now() } : {}),
        });
    },
});

/**
 * Check remaining usage without incrementing.
 */
export const getRemainingUsage = internalQuery({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        const plan = (profile?.plan ?? "free") as PlanType;
        const limits = PLAN_LIMITS[plan];

        const monthStart = getMonthStart();
        const needsReset = !profile?.lastCreditRefill || profile.lastCreditRefill < monthStart;
        const used = needsReset ? 0 : (profile?.totalPredictions ?? 0);

        return {
            used,
            limit: limits.monthlyPredictions,
            remaining: Math.max(0, limits.monthlyPredictions - used),
            plan,
        };
    },
});
