import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        authProvider: v.string(),
        overstayScore: v.number(),
        totalPredictions: v.number(),
        beatTheAiWins: v.number(),
        streak: v.number(),
        createdAt: v.number(),
    }).index("by_email", ["email"]),

    predictions: defineTable({
        userId: v.optional(v.id("users")),
        imageStorageId: v.id("_storage"),
        cardStorageId: v.optional(v.id("_storage")),
        exitTime: v.string(),
        overstayMinutes: v.number(),
        chaosRating: v.number(),
        textRegret: v.number(),
        barHop: v.number(),
        cryRisk: v.number(),
        sunriseRisk: v.string(),
        roastLine: v.string(),
        aiRawResponse: v.string(),
        actualLeaveTime: v.optional(v.string()),
        wasAccurate: v.optional(v.boolean()),
        shareUrl: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_createdAt", ["createdAt"])
        .index("by_shareUrl", ["shareUrl"]),

    badges: defineTable({
        userId: v.id("users"),
        badgeType: v.string(),
        awardedAt: v.number(),
    }).index("by_userId", ["userId"]),

    venues: defineTable({
        name: v.string(),
        location: v.object({ lat: v.number(), lng: v.number() }),
        avgChaosScore: v.number(),
        totalPredictions: v.number(),
        peakNight: v.string(),
    }),
});
