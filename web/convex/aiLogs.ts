import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const saveLog = internalMutation({
    args: {
        requestId: v.string(),
        model: v.string(),
        caller: v.string(),
        timestamp: v.number(),
        durationMs: v.number(),
        systemPrompt: v.string(),
        userPromptText: v.string(),
        hasImage: v.boolean(),
        imageSizeBytes: v.optional(v.number()),
        temperature: v.number(),
        maxTokens: v.number(),
        requestBodySize: v.number(),
        status: v.string(),
        httpStatus: v.number(),
        responseContent: v.string(),
        responseSize: v.number(),
        finishReason: v.optional(v.string()),
        promptTokens: v.optional(v.number()),
        completionTokens: v.optional(v.number()),
        totalTokens: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
        // Cost (hard-saved at time of call)
        inputCostUsd: v.optional(v.number()),
        outputCostUsd: v.optional(v.number()),
        totalCostUsd: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("aiLogs", args);
    },
});

export const getLogs = query({
    args: {
        limit: v.optional(v.number()),
        modelFilter: v.optional(v.string()),
        statusFilter: v.optional(v.string()),
        callerFilter: v.optional(v.string()),
    },
    handler: async (ctx, { limit, modelFilter, statusFilter, callerFilter }) => {
        let logs = await ctx.db
            .query("aiLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(limit ?? 100);

        if (modelFilter) {
            logs = logs.filter(l => l.model === modelFilter);
        }
        if (statusFilter) {
            logs = logs.filter(l => l.status === statusFilter);
        }
        if (callerFilter) {
            logs = logs.filter(l => l.caller === callerFilter);
        }

        return logs;
    },
});

export const getLogStats = query({
    args: {},
    handler: async (ctx) => {
        const logs = await ctx.db
            .query("aiLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(500);

        const models = new Set<string>();
        const callers = new Set<string>();
        let totalTokens = 0;
        let totalDurationMs = 0;
        let successCount = 0;
        let errorCount = 0;

        for (const log of logs) {
            models.add(log.model);
            callers.add(log.caller);
            totalTokens += log.totalTokens ?? 0;
            totalDurationMs += log.durationMs;
            if (log.status === "success") successCount++;
            else errorCount++;
        }

        return {
            totalLogs: logs.length,
            models: Array.from(models),
            callers: Array.from(callers),
            totalTokens,
            avgDurationMs: logs.length > 0 ? Math.round(totalDurationMs / logs.length) : 0,
            successCount,
            errorCount,
        };
    },
});

export const deleteLog = mutation({
    args: { logId: v.id("aiLogs") },
    handler: async (ctx, { logId }) => {
        await ctx.db.delete(logId);
    },
});

export const clearAllLogs = mutation({
    args: {},
    handler: async (ctx) => {
        const logs = await ctx.db
            .query("aiLogs")
            .withIndex("by_timestamp")
            .take(500);

        for (const log of logs) {
            await ctx.db.delete(log._id);
        }
        return logs.length;
    },
});
