import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// ---- Queries ----

export const getSubscription = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) return null;

        return {
            plan: profile.plan ?? "free",
            stripeCustomerId: profile.stripeCustomerId,
        };
    },
});

// ---- Mutations ----

// Update user subscription after successful Stripe webhook
export const updateSubscription = mutation({
    args: {
        stripeCustomerId: v.string(),
        plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    },
    handler: async (ctx, { stripeCustomerId, plan }) => {
        // Find user by stripeCustomerId
        const profile = await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { plan });
        }
    },
});

// Store Stripe customer ID on user profile
export const setStripeCustomerId = mutation({
    args: {
        customerId: v.string(),
    },
    handler: async (ctx, { customerId }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (profile) {
            await ctx.db.patch(profile._id, { stripeCustomerId: customerId });
        }
    },
});

// ---- Actions ----

// Create a Stripe Checkout Session
export const createCheckoutSession = action({
    args: {
        plan: v.union(v.literal("pro"), v.literal("enterprise")),
    },
    handler: async (ctx, { plan }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";

        const priceMap: Record<string, number> = {
            pro: 900, // $9/mo in cents
            enterprise: 2900, // $29/mo in cents
        };

        const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "mode": "subscription",
                "success_url": `${siteUrl}/pricing?success=true`,
                "cancel_url": `${siteUrl}/pricing?canceled=true`,
                "line_items[0][price_data][currency]": "usd",
                "line_items[0][price_data][product_data][name]": `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
                "line_items[0][price_data][recurring][interval]": "month",
                "line_items[0][price_data][unit_amount]": priceMap[plan].toString(),
                "line_items[0][quantity]": "1",
                "metadata[userId]": userId,
                "metadata[plan]": plan,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Stripe error: ${error}`);
        }

        const session = await response.json();
        return { url: session.url };
    },
});
