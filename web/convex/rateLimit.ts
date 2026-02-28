import { query } from "./_generated/server";
import { auth } from "./auth";

// Rate limit: max predictions per window
const MAX_PREDICTIONS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if the current user has exceeded their rate limit.
 */
export const check = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { allowed: false, reason: "Not authenticated" };

        const windowStart = Date.now() - WINDOW_MS;

        const recentPredictions = await ctx.db
            .query("predictions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.gte(q.field("createdAt"), windowStart))
            .collect();

        const count = recentPredictions.length;
        const remaining = Math.max(0, MAX_PREDICTIONS_PER_WINDOW - count);

        return {
            allowed: count < MAX_PREDICTIONS_PER_WINDOW,
            count,
            limit: MAX_PREDICTIONS_PER_WINDOW,
            remaining,
            resetsAt: windowStart + WINDOW_MS,
        };
    },
});
