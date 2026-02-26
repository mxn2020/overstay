import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Stripe webhook endpoint
http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.text();

        // In production, you should verify the webhook signature
        // const sig = request.headers.get("stripe-signature");

        try {
            const event = JSON.parse(body);

            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const plan = session.metadata?.plan === "paid" ? "paid" : "paid"; // Any subscription = paid
                const customerId = session.customer;

                if (customerId && plan) {
                    await ctx.runMutation(api.stripe.updateSubscription, {
                        stripeCustomerId: customerId,
                        plan: plan as "free" | "paid",
                    });
                }
            }

            if (event.type === "customer.subscription.deleted") {
                const subscription = event.data.object;
                const customerId = subscription.customer;

                if (customerId) {
                    await ctx.runMutation(api.stripe.updateSubscription, {
                        stripeCustomerId: customerId,
                        plan: "free",
                    });
                }
            }

            return new Response("OK", { status: 200 });
        } catch {
            return new Response("Webhook error", { status: 400 });
        }
    }),
});

export default http;
