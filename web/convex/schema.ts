import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
    ...authTables,

    // App-specific user profile data (linked to auth users)
    userProfiles: defineTable({
        userId: v.string(), // references authTables users._id
        name: v.optional(v.string()),
        role: v.union(v.literal("user"), v.literal("admin")),
        overstayScore: v.number(),
        totalPredictions: v.number(),
        beatTheAiWins: v.number(),
        streak: v.number(),
        stripeCustomerId: v.optional(v.string()),
        plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
        createdAt: v.number(),
    }).index("by_userId", ["userId"]),

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

    modelTests: defineTable({
        testRunId: v.string(),
        model: v.string(),
        mode: v.string(),
        imageSize: v.number(),
        startedAt: v.number(),
        completedAt: v.number(),
        durationMs: v.number(),
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
        rawResponse: v.string(),
        parsedResult: v.optional(v.string()),
        parseSuccess: v.boolean(),
        hasAllFields: v.boolean(),
        qualityNotes: v.optional(v.string()),
        status: v.string(),
        errorMessage: v.optional(v.string()),
    })
        .index("by_testRunId", ["testRunId"])
        .index("by_model", ["model"])
        .index("by_startedAt", ["startedAt"]),

    aiLogs: defineTable({
        // Identity
        requestId: v.string(),
        model: v.string(),
        caller: v.string(),
        // Timing
        timestamp: v.number(),
        durationMs: v.number(),
        // Request
        systemPrompt: v.string(),
        userPromptText: v.string(),
        hasImage: v.boolean(),
        imageSizeBytes: v.optional(v.number()),
        temperature: v.number(),
        maxTokens: v.number(),
        requestBodySize: v.number(),
        // Response
        status: v.string(),
        httpStatus: v.number(),
        responseContent: v.string(),
        responseSize: v.number(),
        finishReason: v.optional(v.string()),
        // Tokens
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
        // Error
        errorMessage: v.optional(v.string()),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_model_timestamp", ["model", "timestamp"])
        .index("by_caller", ["caller"])
        .index("by_status", ["status"]),

    aiPrompts: defineTable({
        promptId: v.string(),          // e.g., 'guardrail_system', 'vision_user'
        name: v.string(),        // Human readable name e.g., 'Guardrail System Prompt'
        content: v.string(),     // The actual prompt text
        description: v.string(), // What this prompt does
        updatedAt: v.number(),
    }).index("by_prompt_id", ["promptId"]),
});
