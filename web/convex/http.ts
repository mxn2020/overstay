import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// ---- Stripe webhook signature verification (HMAC-SHA256) ----

async function verifyStripeSignature(
    payload: string,
    sigHeader: string,
    secret: string,
): Promise<boolean> {
    // Parse the Stripe-Signature header
    const parts = sigHeader.split(",");
    let timestamp = "";
    const signatures: string[] = [];

    for (const part of parts) {
        const [key, value] = part.trim().split("=");
        if (key === "t") timestamp = value;
        if (key === "v1") signatures.push(value);
    }

    if (!timestamp || signatures.length === 0) return false;

    // Reject events older than 5 minutes (replay protection)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (age > 300) return false;

    // Compute expected signature: HMAC-SHA256(secret, "timestamp.payload")
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(signedPayload),
    );

    // Convert to hex
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    // Timing-safe comparison (compare all chars, don't short-circuit)
    return signatures.some((sig) => {
        if (sig.length !== expectedSig.length) return false;
        let result = 0;
        for (let i = 0; i < sig.length; i++) {
            result |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
        }
        return result === 0;
    });
}

// ---- Stripe webhook endpoint ----

http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.text();
        const sigHeader = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        // Verify webhook signature (skip in development if no secret set)
        if (webhookSecret) {
            if (!sigHeader) {
                return new Response("Missing stripe-signature header", { status: 400 });
            }
            const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
            if (!valid) {
                return new Response("Invalid signature", { status: 400 });
            }
        }

        try {
            const event = JSON.parse(body);


            // ---- checkout.session.completed ----
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const customerId = session.customer;

                if (!userId) {
                    console.warn("Stripe webhook: missing userId in session metadata");
                    return new Response("OK", { status: 200 });
                }

                // Top-up purchase (one-time payment)
                if (session.metadata?.type === "topup") {
                    const credits = parseInt(session.metadata.credits, 10);
                    const packageId = session.metadata.packageId;


                    if (credits > 0) {
                        await ctx.runAction(api.stripe.handleTopUpSuccess, {
                            userId,
                            credits,
                            stripeSessionId: session.id,
                            packageLabel: `${credits} credits (${packageId})`,
                        });

                        // Audit log
                        await ctx.runMutation(internal.auditLog.logSystem, {
                            action: "billing.topup_completed",
                            category: "billing",
                            userId,
                            details: JSON.stringify({
                                credits,
                                packageId,
                                sessionId: session.id,
                                customerId,
                            }),
                        });
                    }
                }

                // Subscription purchase
                if (session.metadata?.plan === "paid" && customerId) {
                    await ctx.runAction(api.stripe.handleSubscriptionActive, {
                        userId,
                        stripeCustomerId: customerId,
                    });

                    // Audit log
                    await ctx.runMutation(internal.auditLog.logSystem, {
                        action: "billing.subscription_activated",
                        category: "billing",
                        userId,
                        details: JSON.stringify({
                            plan: "paid",
                            customerId,
                            sessionId: session.id,
                        }),
                    });
                }
            }

            // ---- customer.subscription.deleted ----
            if (event.type === "customer.subscription.deleted") {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                if (customerId) {
                    await ctx.runMutation(api.stripe.updateSubscription, {
                        stripeCustomerId: customerId,
                        plan: "free",
                    });

                    // Audit log
                    await ctx.runMutation(internal.auditLog.logSystem, {
                        action: "billing.subscription_cancelled",
                        category: "billing",
                        details: JSON.stringify({
                            customerId,
                            subscriptionId: subscription.id,
                        }),
                    });
                }
            }

            return new Response("OK", { status: 200 });
        } catch (err) {
            console.error("Stripe webhook error:", err);
            return new Response("Webhook error", { status: 400 });
        }
    }),
});

export default http;
