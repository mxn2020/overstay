import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { calculateExitTime, calculateChaosRating, calculateSecondaryPredictions, selectRoastLine, formatExitTime } from "./scoring";
import { internal } from "./_generated/api";
// === Queries ===

export const getById = query({
    args: { id: v.id("predictions") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

// Get the current user's predictions (for My Wall of Shame)
export const getMyPredictions = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("predictions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(limit ?? 50);
    },
});


export const getPublicRecent = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit }) => {
        const take = limit ?? 10;
        return await ctx.db
            .query("predictions")
            .withIndex("by_createdAt")
            .order("desc")
            .take(take);
    },
});

// === Mutations ===

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const analyzeUploaded = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, { storageId }) => {
        // --- Rate Limiting ---
        const userId = await auth.getUserId(ctx);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        if (userId) {
            const recent = await ctx.db
                .query("predictions")
                .withIndex("by_userId", (q) => q.eq("userId", userId))
                .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
                .collect();

            if (recent.length >= 10) {
                throw new Error("RATE_LIMIT_EXCEEDED");
            }
        } else {
            // For MVP: Simple IP-based (or just global unauth) limit if no userId
            // Convex doesn't expose IP easily in standard queries without headers, 
            // so we'll just strictly limit unauthenticated usage globally or require auth.
            // A better way is passing an anonymous client ID, but for now we'll just check
            // total recent unauth predictions to prevent massive bot abuse.
            const recentUnauth = await ctx.db
                .query("predictions")
                .withIndex("by_createdAt")
                .filter((q) => q.eq(q.field("userId"), undefined))
                .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
                .collect();

            if (recentUnauth.length >= 50) { // Global unauth limit per hour
                throw new Error("RATE_LIMIT_EXCEEDED");
            }
        }
        // ---------------------

        // For MVP: Use the scoring engine with simulated signals
        // In production, this would call the Vision API action
        const currentHour = new Date().getHours();

        // Generate plausible random signals for MVP demo
        const signals = generateDemoSignals();

        const justOneLastDrinkMinutes = calculateExitTime(currentHour, signals);
        const exitTime = formatExitTime(new Date(), justOneLastDrinkMinutes);
        const chaosRating = calculateChaosRating(signals, justOneLastDrinkMinutes);
        const secondary = calculateSecondaryPredictions(signals, chaosRating);
        const roastLine = selectRoastLine(chaosRating, signals);

        const predictionId = await ctx.db.insert("predictions", {
            imageStorageId: storageId,
            exitTime,
            justOneLastDrinkMinutes,
            chaosRating,
            textRegret: secondary.textRegret,
            barHop: secondary.barHop,
            cryRisk: secondary.cryRisk,
            sunriseRisk: secondary.sunriseRisk,
            roastLine,
            aiRawResponse: JSON.stringify(signals),
            createdAt: Date.now(),
        });

        return {
            predictionId,
            exitTime,
            justOneLastDrinkMinutes,
            chaosRating,
            textRegret: secondary.textRegret,
            barHop: secondary.barHop,
            cryRisk: secondary.cryRisk,
            sunriseRisk: secondary.sunriseRisk,
            roastLine,
        };
    },
});

export const reportActual = mutation({
    args: {
        predictionId: v.id("predictions"),
        actualLeaveTime: v.string(),
    },
    handler: async (ctx, { predictionId, actualLeaveTime }) => {
        await ctx.db.patch(predictionId, { actualLeaveTime });
        return { success: true };
    },
});

export const markAccuracy = mutation({
    args: {
        predictionId: v.id("predictions"),
        wasAccurate: v.boolean(),
    },
    handler: async (ctx, { predictionId, wasAccurate }) => {
        await ctx.db.patch(predictionId, { wasAccurate });
    },
});

// Save a prediction result for the authenticated user (called by frontend after AI pipeline)
export const savePrediction = mutation({
    args: {
        exitTime: v.string(),
        justOneLastDrinkMinutes: v.number(),
        chaosRating: v.number(),
        textRegret: v.number(),
        barHop: v.number(),
        cryRisk: v.number(),
        sunriseRisk: v.string(),
        roastLine: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // --- Rate Limiting ---
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const recent = await ctx.db
            .query("predictions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
            .collect();

        if (recent.length >= 10) {
            throw new Error("RATE_LIMIT_EXCEEDED");
        }
        // ---------------------

        // Generate a placeholder storageId isn't available from frontend
        // The image was processed server-side but not stored per-prediction
        // We'll store the prediction data for the user's history
        const predictionId = await ctx.db.insert("predictions", {
            userId,
            ...args,
            aiRawResponse: "{}",
            createdAt: Date.now(),
        });

        // --- Auto-Award Badges ---
        // 1. First Sip (First Prediction)
        if (recent.length === 0) {
            await ctx.runMutation(internal.badges.awardInternal, { userId, badgeType: "first_prediction" });
        }

        // 2. Agent of Chaos (Chaos >= 9.0)
        if (args.chaosRating >= 9.0) {
            await ctx.runMutation(internal.badges.awardInternal, { userId, badgeType: "chaos_9" });
        }

        // 3. Night Owl (Exit time after 4:00 AM)
        const exitHourStr = args.exitTime.split(":")[0];
        const isAM = args.exitTime.includes("AM");
        if (isAM && (exitHourStr === "4" || exitHourStr === "5" || exitHourStr === "6")) {
            await ctx.runMutation(internal.badges.awardInternal, { userId, badgeType: "night_owl" });
        }
        // -------------------------

        return { predictionId };
    },
});

// This simulates what the Vision API would return
// Replace with real AI analysis in production

interface DemoSignals {
    setting: string;
    face_count: number;
    estimated_group_size: number;
    drinks_visible: {
        count: number;
        types: string[];
        empty_glasses: number;
    };
    lighting: {
        brightness: string;
        neon_present: boolean;
        strobe_likely: boolean;
        color_dominant: string;
    };
    crowd_density: string;
    emotional_vibe: string;
    objects_detected: string[];
    activity_level: number;
    chaos_indicators: string[];
    food_visible: boolean;
    water_visible: boolean;
    time_cues: string;
}

function generateDemoSignals(): DemoSignals {
    const settings = ["bar", "club", "restaurant", "house_party"];
    const vibes = ["calm", "happy", "excited", "wild"];
    const densities = ["sparse", "moderate", "packed"];
    const drinkTypes = ["beer", "cocktail", "shot", "wine"];

    const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const selectedDrinks = drinkTypes.filter(() => Math.random() > 0.5);
    if (selectedDrinks.length === 0) selectedDrinks.push("beer");

    const chaosOptions = ["group_cheering", "someone_on_table", "spilled_drink", "birthday_decoration"];
    const chaos = chaosOptions.filter(() => Math.random() > 0.7);

    const objects: string[] = [];
    if (Math.random() > 0.7) objects.push("dj_booth");
    if (Math.random() > 0.6) objects.push("dance_floor");
    if (Math.random() > 0.8) objects.push("phone_out");

    return {
        setting: rand(settings),
        face_count: randInt(1, 8),
        estimated_group_size: randInt(1, 10),
        drinks_visible: {
            count: randInt(1, 8),
            types: selectedDrinks,
            empty_glasses: randInt(0, 5),
        },
        lighting: {
            brightness: rand(["dark", "dim", "moderate"]),
            neon_present: Math.random() > 0.4,
            strobe_likely: Math.random() > 0.7,
            color_dominant: rand(["purple", "blue", "red", "warm"]),
        },
        crowd_density: rand(densities),
        emotional_vibe: rand(vibes),
        objects_detected: objects,
        activity_level: randInt(3, 9),
        chaos_indicators: chaos,
        food_visible: Math.random() > 0.7,
        water_visible: Math.random() > 0.8,
        time_cues: rand(["night", "late_night"]),
    };
}
