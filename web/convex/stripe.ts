import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { auth } from "./auth";

// ---- Top-up packages ----
const TOP_UP_PACKAGES: Record<string, { credits: number; cents: number; label: string }> = {
    "topup_40": { credits: 40, cents: 100, label: "40 credits" },
    "topup_100": { credits: 100, cents: 200, label: "100 credits" },
    "topup_250": { credits: 250, cents: 400, label: "250 credits" },
};

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
            creditBalance: profile.creditBalance ?? 0,
            stripeCustomerId: profile.stripeCustomerId,
        };
    },
});

// ---- Mutations ----

// Update user subscription after successful Stripe webhook
export const updateSubscription = mutation({
    args: {
        stripeCustomerId: v.string(),
        plan: v.union(v.literal("free"), v.literal("paid")),
    },
    handler: async (ctx, { stripeCustomerId, plan }) => {
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

// Create a Stripe Checkout Session for subscription ($3/mo)
export const createCheckoutSession = action({
    args: {
        plan: v.literal("paid"),
    },
    handler: async (ctx, { plan }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const siteUrl = process.env.SITE_URL ?? "http://localhost:5185";

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
                "line_items[0][price_data][product_data][name]": "JustOneLastDrink Pro — 100 credits/month",
                "line_items[0][price_data][recurring][interval]": "month",
                "line_items[0][price_data][unit_amount]": "300", // $3.00
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

// Create a Stripe Checkout Session for credit top-up (one-time)
export const createTopUpSession = action({
    args: {
        packageId: v.string(), // "topup_40", "topup_100", "topup_250"
    },
    handler: async (ctx, { packageId }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const pkg = TOP_UP_PACKAGES[packageId];
        if (!pkg) throw new Error(`Invalid package: ${packageId}`);

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const siteUrl = process.env.SITE_URL ?? "http://localhost:5185";

        const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "mode": "payment",
                "success_url": `${siteUrl}/pricing?topup=success`,
                "cancel_url": `${siteUrl}/pricing?topup=canceled`,
                "line_items[0][price_data][currency]": "usd",
                "line_items[0][price_data][product_data][name]": `Top-up: ${pkg.label} (never expire)`,
                "line_items[0][price_data][unit_amount]": pkg.cents.toString(),
                "line_items[0][quantity]": "1",
                "metadata[userId]": userId,
                "metadata[type]": "topup",
                "metadata[packageId]": packageId,
                "metadata[credits]": pkg.credits.toString(),
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

// Handle successful top-up (called from webhook or manually)
export const handleTopUpSuccess = action({
    args: {
        userId: v.string(),
        credits: v.number(),
        stripeSessionId: v.optional(v.string()),
        packageLabel: v.optional(v.string()),
    },
    handler: async (ctx, { userId, credits, stripeSessionId, packageLabel }) => {
        await ctx.runMutation(internal.credits.addPurchasedCredits, {
            userId,
            amount: credits,
            description: packageLabel ? `Top-up: ${packageLabel}` : `Credit purchase: ${credits} credits`,
            stripeSessionId,
        });
    },
});

// Handle subscription activation (called from webhook)
export const handleSubscriptionActive = action({
    args: {
        userId: v.string(),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, { userId, stripeCustomerId }) => {
        // Set plan to paid
        const profile = await ctx.runQuery(internal.users.getProfileByUserId, { userId });
        if (profile) {
            await ctx.runMutation(internal.users.updatePlanInternal, {
                profileId: profile._id,
                plan: "paid",
                stripeCustomerId,
            });
            // Grant initial 100 credits
            await ctx.runMutation(internal.credits.addPurchasedCredits, {
                userId,
                amount: 100,
                description: "Pro plan activated — 100 monthly credits",
            });
        }
    },
});
