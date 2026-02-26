import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Internal query for use by actions (nvidia.ts cost calculation)
export const getModelCostInternal = internalQuery({
    args: { model: v.string() },
    handler: async (ctx, { model }) => {
        return await ctx.db
            .query("modelCosts")
            .withIndex("by_model", (q) => q.eq("model", model))
            .first();
    },
});

// ---- Queries ----

export const getModelCosts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("modelCosts").collect();
    },
});

export const getModelCost = query({
    args: { model: v.string() },
    handler: async (ctx, { model }) => {
        return await ctx.db
            .query("modelCosts")
            .withIndex("by_model", (q) => q.eq("model", model))
            .first();
    },
});

// Cost dashboard: aggregate costs from aiLogs
export const getCostDashboard = query({
    args: {
        days: v.optional(v.number()), // last N days, default 30
    },
    handler: async (ctx, { days }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile?.role !== "admin") return null;

        const cutoff = Date.now() - (days ?? 30) * 24 * 60 * 60 * 1000;

        const logs = await ctx.db
            .query("aiLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(2000);

        // Filter to time range
        const filtered = logs.filter((l) => l.timestamp >= cutoff);

        let totalCost = 0;
        let totalInputCost = 0;
        let totalOutputCost = 0;
        let totalCalls = 0;

        const byModel: Record<string, {
            calls: number;
            inputCost: number;
            outputCost: number;
            totalCost: number;
            inputTokens: number;
            outputTokens: number;
        }> = {};

        const byDay: Record<string, number> = {};

        for (const log of filtered) {
            const cost = log.totalCostUsd ?? 0;
            totalCost += cost;
            totalInputCost += log.inputCostUsd ?? 0;
            totalOutputCost += log.outputCostUsd ?? 0;
            totalCalls++;

            // By model
            if (!byModel[log.model]) {
                byModel[log.model] = { calls: 0, inputCost: 0, outputCost: 0, totalCost: 0, inputTokens: 0, outputTokens: 0 };
            }
            byModel[log.model].calls++;
            byModel[log.model].inputCost += log.inputCostUsd ?? 0;
            byModel[log.model].outputCost += log.outputCostUsd ?? 0;
            byModel[log.model].totalCost += cost;
            byModel[log.model].inputTokens += log.promptTokens ?? 0;
            byModel[log.model].outputTokens += log.completionTokens ?? 0;

            // By day
            const day = new Date(log.timestamp).toISOString().split("T")[0];
            byDay[day] = (byDay[day] ?? 0) + cost;
        }

        return {
            totalCost: Math.round(totalCost * 100000) / 100000,
            totalInputCost: Math.round(totalInputCost * 100000) / 100000,
            totalOutputCost: Math.round(totalOutputCost * 100000) / 100000,
            totalCalls,
            byModel: Object.entries(byModel).map(([model, data]) => ({
                model,
                ...data,
                totalCost: Math.round(data.totalCost * 100000) / 100000,
            })),
            byDay: Object.entries(byDay)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, cost]) => ({ date, cost: Math.round(cost * 100000) / 100000 })),
        };
    },
});

// ---- Mutations ----

export const setModelCost = mutation({
    args: {
        model: v.string(),
        displayName: v.optional(v.string()),
        inputCostPer1k: v.number(),
        outputCostPer1k: v.number(),
    },
    handler: async (ctx, { model, displayName, inputCostPer1k, outputCostPer1k }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile?.role !== "admin") throw new Error("Not authorized");

        const existing = await ctx.db
            .query("modelCosts")
            .withIndex("by_model", (q) => q.eq("model", model))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                inputCostPer1k,
                outputCostPer1k,
                displayName: displayName ?? existing.displayName,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            return await ctx.db.insert("modelCosts", {
                model,
                displayName,
                inputCostPer1k,
                outputCostPer1k,
                updatedAt: Date.now(),
            });
        }
    },
});

// Seed default model costs
export const seedModelCosts = mutation({
    args: {},
    handler: async (ctx) => {
        const defaults = [
            { model: "microsoft/phi-3.5-vision-instruct", displayName: "Phi 3.5 Vision", inputCostPer1k: 0.0, outputCostPer1k: 0.0 },
            { model: "microsoft/phi-4-multimodal-instruct", displayName: "Phi 4 Multimodal", inputCostPer1k: 0.0, outputCostPer1k: 0.0 },
            { model: "nvidia/nemotron-3-nano-30b-a3b", displayName: "Nemotron 3 Nano", inputCostPer1k: 0.0, outputCostPer1k: 0.0 },
            { model: "moonshotai/kimi-k2.5", displayName: "Kimi K2.5", inputCostPer1k: 0.0, outputCostPer1k: 0.0 },
            { model: "google/gemma-3-27b-it", displayName: "Gemma 3 27B", inputCostPer1k: 0.0, outputCostPer1k: 0.0 },
        ];

        let added = 0;
        for (const d of defaults) {
            const existing = await ctx.db
                .query("modelCosts")
                .withIndex("by_model", (q) => q.eq("model", d.model))
                .first();
            if (!existing) {
                await ctx.db.insert("modelCosts", { ...d, updatedAt: Date.now() });
                added++;
            }
        }
        return added;
    },
});
