import { action, mutation, internalMutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { auth } from "./auth";

// ---- Top-up packages (maps packageId → credits for validation) ----
const TOP_UP_PACKAGES: Record<string, { credits: number; priceEnvVar: string }> = {
    "topup_40": { credits: 40, priceEnvVar: "STRIPE_PRICE_TOPUP_40" },
    "topup_100": { credits: 100, priceEnvVar: "STRIPE_PRICE_TOPUP_100" },
    "topup_250": { credits: 250, priceEnvVar: "STRIPE_PRICE_TOPUP_250" },
};

// ---- Helpers ----

/** Create or retrieve a Stripe Customer for the authenticated user. */
async function createOrGetCustomer(
    stripeKey: string,
    userId: string,
    email?: string,
    existingCustomerId?: string,
): Promise<string> {
    // Reuse existing customer if we have one
    if (existingCustomerId) return existingCustomerId;

    const params = new URLSearchParams({
        "metadata[app]": "justonelastdrink",
        "metadata[userId]": userId,
    });
    if (email) params.set("email", email);

    const response = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stripe customer creation failed: ${error}`);
    }

    const customer = await response.json();
    return customer.id;
}

// ---- Internal Queries (for webhook handlers) ----

export const getProfileByStripeCustomerId = internalQuery({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, { stripeCustomerId }) => {
        return await ctx.db
            .query("userProfiles")
            .filter((q) => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
            .first();
    },
});

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

// Store Stripe customer ID on user profile (internal — called from checkout actions)
export const setStripeCustomerId = internalMutation({
    args: {
        customerId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, { customerId, userId }) => {
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

// Create a Stripe Checkout Session for subscription (Pro plan)
export const createCheckoutSession = action({
    args: {
        plan: v.literal("paid"),
    },
    handler: async (ctx, { plan }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const proPriceId = process.env.STRIPE_PRICE_PRO;
        if (!proPriceId) throw new Error("STRIPE_PRICE_PRO not configured");

        const siteUrl = process.env.SITE_URL ?? "http://localhost:5185";

        // Get existing profile for customer ID
        const profile = await ctx.runQuery(internal.users.getProfileByUserId, { userId });
        const customerId = await createOrGetCustomer(
            stripeKey, userId, undefined, profile?.stripeCustomerId ?? undefined,
        );

        // Save customer ID if new
        if (!profile?.stripeCustomerId) {
            await ctx.runMutation(internal.stripe.setStripeCustomerId, { customerId, userId });
        }

        const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "mode": "subscription",
                "customer": customerId,
                "success_url": `${siteUrl}/pricing?success=true`,
                "cancel_url": `${siteUrl}/pricing?canceled=true`,
                "line_items[0][price]": proPriceId,
                "line_items[0][quantity]": "1",
                "metadata[app]": "justonelastdrink",
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

        const priceId = process.env[pkg.priceEnvVar];
        if (!priceId) throw new Error(`${pkg.priceEnvVar} not configured`);

        const siteUrl = process.env.SITE_URL ?? "http://localhost:5185";

        // Get existing profile for customer ID
        const profile = await ctx.runQuery(internal.users.getProfileByUserId, { userId });
        const customerId = await createOrGetCustomer(
            stripeKey, userId, undefined, profile?.stripeCustomerId ?? undefined,
        );

        if (!profile?.stripeCustomerId) {
            await ctx.runMutation(internal.stripe.setStripeCustomerId, { customerId, userId });
        }

        const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "mode": "payment",
                "customer": customerId,
                "success_url": `${siteUrl}/pricing?topup=success`,
                "cancel_url": `${siteUrl}/pricing?topup=canceled`,
                "line_items[0][price]": priceId,
                "line_items[0][quantity]": "1",
                "metadata[app]": "justonelastdrink",
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

// Create a Stripe Customer Portal session (manage subscription, payment methods)
export const createPortalSession = action({
    args: {},
    handler: async (ctx): Promise<{ url: string }> => {
        const userId: string | null = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const stripeKey: string | undefined = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const siteUrl: string = process.env.SITE_URL ?? "http://localhost:5185";

        const profile: { stripeCustomerId?: string } | null = await ctx.runQuery(
            internal.users.getProfileByUserId, { userId }
        );
        if (!profile?.stripeCustomerId) {
            throw new Error("No Stripe customer found. Subscribe first.");
        }

        const portalResponse: globalThis.Response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                customer: profile.stripeCustomerId,
                return_url: `${siteUrl}/billing`,
            }),
        });

        if (!portalResponse.ok) {
            const errorText: string = await portalResponse.text();
            throw new Error(`Stripe Portal error: ${errorText}`);
        }

        const portalSession: { url: string } = await portalResponse.json();
        return { url: portalSession.url };
    },
});

// Handle successful top-up (called from webhook)
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
        let profile = await ctx.runQuery(internal.users.getProfileByUserId, { userId });

        // If no profile exists yet, create one (new user who subscribed before visiting the app)
        if (!profile) {
            await ctx.runMutation(internal.users.ensureProfileInternal, { userId });
            profile = await ctx.runQuery(internal.users.getProfileByUserId, { userId });
        }

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
