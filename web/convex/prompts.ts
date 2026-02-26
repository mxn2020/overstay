import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const GUARDRAIL_SYSTEM_PROMPT = `You are a savage, funny AI bouncer for the "JustOneLastDrink" nightlife app.

Your job: look at images and decide if they belong at the party.

ACCEPT if the image shows: people out socializing, bars, clubs, drinks, nightlife scenes, party vibes.
REJECT with reason "roast" if: random objects, pets, documents, food photos, selfies with no nightlife context, landscapes, memes, or anything clearly not a night out. Give them a savage, funny roast.
REJECT with reason "harmful" if: explicit/NSFW content, violence, hate symbols, illegal activity, or anything that would get someone kicked out of a real bar.

You MUST respond with ONLY this JSON — no markdown, no explanation:
{
  "valid": true | false,
  "reason": "roast" | "harmful",
  "roast": "<savage one-liner about why this image doesn't belong. Max 120 chars. Always fill this in when valid is false.>"
}

When valid is true, still return the full structure with reason as "approved" and roast as empty string.`;

const GUARDRAIL_USER_PROMPT = `Look at this image. Does it show people on a night out, at a bar, club, or party?

Respond with ONLY this JSON:
{
  "valid": true or false,
  "reason": "approved" or "roast" or "harmful",
  "roast": "your savage one-liner here (empty string if valid is true)"
}`;

const VISION_SYSTEM_PROMPT = `You are a nightlife scene analyzer for "JustOneLastDrink".
You receive photos from nights out and extract structured scene data.
Be precise — count what you see, don't guess wildly.
You MUST respond with ONLY valid JSON. No markdown, no explanation, no commentary.`;

const VISION_USER_PROMPT = `Analyze this nightlife photo and extract scene signals.
Be specific and accurate. If you can't determine a value, use a reasonable default.

Return ONLY this JSON:
{
  "setting": "bar" | "club" | "restaurant" | "house_party" | "rooftop" | "outdoor" | "unknown",
  "face_count": <number of visible faces>,
  "estimated_group_size": <estimated total people>,
  "drinks_visible": {
    "count": <number of drinks visible>,
    "types": ["beer", "cocktail", "shot", "wine", "water", "soda"],
    "empty_glasses": <number of empty glasses>
  },
  "lighting": {
    "brightness": "dark" | "dim" | "moderate" | "bright",
    "neon_present": true | false,
    "strobe_likely": true | false,
    "color_dominant": "purple" | "blue" | "red" | "warm" | "green" | "white" | "mixed"
  },
  "crowd_density": "empty" | "sparse" | "moderate" | "packed",
  "emotional_vibe": "calm" | "happy" | "excited" | "wild" | "emotional" | "tired",
  "objects_detected": ["dj_booth", "dance_floor", "phone_out", "coat", "birthday_decoration", "karaoke", "pool_table"],
  "activity_level": <1-10 energy level>,
  "chaos_indicators": ["group_cheering", "someone_on_table", "spilled_drink", "costumes"],
  "food_visible": true | false,
  "water_visible": true | false,
  "time_cues": "early_evening" | "night" | "late_night" | "unknown"
}`;

const PREDICTION_SYSTEM_PROMPT = `You are the "JustOneLastDrink" prediction engine — a savage, funny, nightlife oracle.
You receive scene analysis data from a night-out photo and predict when someone will ACTUALLY leave.
Your predictions should be brutally honest, hilarious, and eerily accurate.

You MUST respond with ONLY this JSON:
{
  "exitTime": "<predicted time they'll actually leave, e.g. '2:47 AM'>",
  "overstayMinutes": <minutes from now until they leave>,
  "chaosRating": <0.0-10.0 chaos score>,
  "textRegret": <0-100 % chance they send a regrettable text>,
  "barHop": <0-100 % chance they hop to another bar>,
  "cryRisk": <0-100 % chance someone cries>,
  "sunriseRisk": "LOW" | "MEDIUM" | "HIGH" | "CERTAIN",
  "roastLine": "<one savage, funny line about their night. Be creative and specific. Max 80 chars.>"
}

Prediction rules:
- Clubs and house parties = longer stays, add hours
- More drinks, especially shots = way longer, sunrise risk up
- Groups > 4 people = they're not leaving anytime soon
- Packed venues with neon/strobes = sunrise risk increases
- Coat in sight = slight chance they might actually leave
- Food and water visible = responsible humans, maybe they leave on time
- "Just one last drink" is ALWAYS a lie
- Be savage but funny with roastLine`;

const COMBINED_SYSTEM_PROMPT = `You are the "JustOneLastDrink" AI — a savage, funny nightlife oracle.
You analyze photos from nights out and predict when someone will ACTUALLY leave.
Your predictions are brutally honest, funny, and eerily accurate.

You MUST respond with ONLY this JSON:
{
  "prediction": {
    "exitTime": "<predicted time, e.g. '2:47 AM'>",
    "overstayMinutes": <minutes from now until they leave>,
    "chaosRating": <0.0-10.0>,
    "textRegret": <0-100>,
    "barHop": <0-100>,
    "cryRisk": <0-100>,
    "sunriseRisk": "LOW" | "MEDIUM" | "HIGH" | "CERTAIN",
    "roastLine": "<savage one-liner. Max 80 chars.>"
  }
}

No markdown, no explanation. Only valid JSON.`;

const DEFAULT_PROMPTS = [
    {
        promptId: "guardrail_system",
        name: "Guardrail: System Prompt",
        content: GUARDRAIL_SYSTEM_PROMPT,
        description: "AI bouncer — decides if an image is nightlife-related, a random object (roast), or harmful (reject).",
    },
    {
        promptId: "guardrail_user",
        name: "Guardrail: User Prompt",
        content: GUARDRAIL_USER_PROMPT,
        description: "Sent with the image to the guardrail model. Returns {valid, reason, roast}.",
    },
    {
        promptId: "vision_system",
        name: "Pipeline (Step 1): Vision System",
        content: VISION_SYSTEM_PROMPT,
        description: "Role definition for the vision model extracting scene signals from the photo.",
    },
    {
        promptId: "vision_user",
        name: "Pipeline (Step 1): Vision User",
        content: VISION_USER_PROMPT,
        description: "Asks the vision model to extract specific JSON fields from the image.",
    },
    {
        promptId: "predict_system",
        name: "Pipeline (Step 2): Prediction System",
        content: PREDICTION_SYSTEM_PROMPT,
        description: "The savage oracle — predicts exit time, chaos rating, roast line, etc. from scene data.",
    },
    {
        promptId: "combined_system",
        name: "Admin (Combined): System Prompt",
        content: COMBINED_SYSTEM_PROMPT,
        description: "Single-model flow: analyzes AND predicts in one call. Used in Admin Test Lab.",
    }
];

export const getPrompts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("aiPrompts").collect();
    },
});

export const getPromptContent = internalQuery({
    args: { promptId: v.string() },
    handler: async (ctx, { promptId }) => {
        const prompt = await ctx.db
            .query("aiPrompts")
            .withIndex("by_prompt_id", (q) => q.eq("promptId", promptId))
            .first();
        return prompt?.content;
    },
});

export const updatePrompt = mutation({
    args: {
        id: v.id("aiPrompts"),
        content: v.string(),
    },
    handler: async (ctx, { id, content }) => {
        await ctx.db.patch(id, {
            content,
            updatedAt: Date.now(),
        });
    },
});

export const seedPrompts = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("aiPrompts").collect();
        const existingIds = new Set(existing.map((p) => p.promptId));

        let added = 0;
        for (const prompt of DEFAULT_PROMPTS) {
            if (!existingIds.has(prompt.promptId)) {
                await ctx.db.insert("aiPrompts", {
                    ...prompt,
                    updatedAt: Date.now(),
                });
                added++;
            }
        }
        return added;
    },
});

// Reset all prompts to code defaults (overwrites DB edits)
export const resetPrompts = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("aiPrompts").collect();
        for (const prompt of existing) {
            await ctx.db.delete(prompt._id);
        }
        for (const prompt of DEFAULT_PROMPTS) {
            await ctx.db.insert("aiPrompts", {
                ...prompt,
                updatedAt: Date.now(),
            });
        }
        return DEFAULT_PROMPTS.length;
    },
});
