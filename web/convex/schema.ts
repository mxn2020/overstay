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
        plan: v.optional(v.union(v.literal("free"), v.literal("paid"))),
        creditBalance: v.optional(v.number()),    // current credits
        lastCreditRefill: v.optional(v.number()), // timestamp of last monthly refill
        createdAt: v.number(),
    }).index("by_userId", ["userId"]),

    // Credit transaction history
    creditTransactions: defineTable({
        userId: v.string(),
        type: v.union(
            v.literal("purchase"),  // Stripe top-up
            v.literal("refill"),    // Monthly allowance
            v.literal("deduct"),    // Prediction usage
            v.literal("bonus"),     // Admin grant
            v.literal("refund"),    // Failed prediction refund
        ),
        amount: v.number(),         // positive = add, negative = deduct
        balanceBefore: v.number(),
        balanceAfter: v.number(),
        description: v.string(),
        stripeSessionId: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_userId", ["userId", "timestamp"])
        .index("by_type", ["type", "timestamp"])
        .index("by_timestamp", ["timestamp"]),

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

    // Public storyboard — shared prediction cards
    sharedCards: defineTable({
        userId: v.string(),
        userName: v.optional(v.string()),
        // Prediction snapshot (hard-saved so card persists even if prediction deleted)
        exitTime: v.string(),
        overstayMinutes: v.number(),
        chaosRating: v.number(),
        textRegret: v.number(),
        barHop: v.number(),
        cryRisk: v.number(),
        sunriseRisk: v.string(),
        roastLine: v.string(),
        imageStorageId: v.optional(v.id("_storage")), // card screenshot
        isPublic: v.boolean(),
        likes: v.number(),
        sharedAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_public_date", ["isPublic", "sharedAt"])
        .index("by_likes", ["isPublic", "likes"]),

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
        // Cost (hard-saved at time of call using modelCosts rates)
        inputCostUsd: v.optional(v.number()),
        outputCostUsd: v.optional(v.number()),
        totalCostUsd: v.optional(v.number()),
        // Error
        errorMessage: v.optional(v.string()),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_model_timestamp", ["model", "timestamp"])
        .index("by_caller", ["caller"])
        .index("by_status", ["status"]),

    // Admin: model pricing per 1k tokens
    modelCosts: defineTable({
        model: v.string(),           // e.g. "microsoft/phi-3.5-vision-instruct"
        displayName: v.optional(v.string()),
        inputCostPer1k: v.number(),  // USD per 1,000 input tokens
        outputCostPer1k: v.number(), // USD per 1,000 output tokens
        updatedAt: v.number(),
    }).index("by_model", ["model"]),

    aiPrompts: defineTable({
        promptId: v.string(),
        name: v.string(),
        content: v.string(),
        description: v.string(),
        updatedAt: v.number(),
    }).index("by_prompt_id", ["promptId"]),

    auditLogs: defineTable({
        action: v.string(),
        category: v.union(v.literal("auth"), v.literal("admin"), v.literal("system"), v.literal("billing")),
        userId: v.optional(v.string()),
        targetId: v.optional(v.string()),
        details: v.string(),
        ipAddress: v.optional(v.string()),
        timestamp: v.number(),
    })
        .index("by_timestamp", ["timestamp"])
        .index("by_category", ["category", "timestamp"])
        .index("by_userId", ["userId", "timestamp"])
        .index("by_action", ["action", "timestamp"]),
});
