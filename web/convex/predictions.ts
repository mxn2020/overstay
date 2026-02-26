import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { calculateExitTime, calculateChaosRating, calculateSecondaryPredictions, selectRoastLine, formatExitTime } from "./scoring";

// === Queries ===

export const getById = query({
    args: { id: v.id("predictions") },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
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

// === Demo Signal Generator ===
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
