import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// ---- Queries ----

// Get public cards for storyboard (paginated)
export const getPublicCards = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit }) => {
        return await ctx.db
            .query("sharedCards")
            .withIndex("by_public_date", (q) => q.eq("isPublic", true))
            .order("desc")
            .take(limit ?? 50);
    },
});

// Get user's own shared cards
export const getMyCards = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("sharedCards")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

// ---- Mutations ----

// Share a prediction card to the storyboard
export const shareCard = mutation({
    args: {
        exitTime: v.string(),
        justOneLastDrinkMinutes: v.number(),
        chaosRating: v.number(),
        textRegret: v.number(),
        barHop: v.number(),
        cryRisk: v.number(),
        sunriseRisk: v.string(),
        roastLine: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        return await ctx.db.insert("sharedCards", {
            userId,
            userName: profile?.name ?? "Anonymous",
            ...args,
            isPublic: true,
            likes: 0,
            sharedAt: Date.now(),
        });
    },
});

// Toggle card visibility
export const toggleCardVisibility = mutation({
    args: { cardId: v.id("sharedCards") },
    handler: async (ctx, { cardId }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const card = await ctx.db.get(cardId);
        if (!card || card.userId !== userId) throw new Error("Not your card");

        await ctx.db.patch(cardId, { isPublic: !card.isPublic });
        return { isPublic: !card.isPublic };
    },
});

// Delete a shared card
export const deleteCard = mutation({
    args: { cardId: v.id("sharedCards") },
    handler: async (ctx, { cardId }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const card = await ctx.db.get(cardId);
        if (!card || card.userId !== userId) throw new Error("Not your card");

        await ctx.db.delete(cardId);
    },
});

// Like a card
export const likeCard = mutation({
    args: { cardId: v.id("sharedCards") },
    handler: async (ctx, { cardId }) => {
        const card = await ctx.db.get(cardId);
        if (!card || !card.isPublic) throw new Error("Card not found");

        await ctx.db.patch(cardId, { likes: card.likes + 1 });
        return { likes: card.likes + 1 };
    },
});
