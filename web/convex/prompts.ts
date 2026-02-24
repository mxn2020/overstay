import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const GUARDRAIL_SYSTEM_PROMPT = `You are a savage, funny AI guardrail for the "JustOneLastDrink" nightlife app.
Your only job is to look at images and determine if they are actually photos of people, bars, drinks, or nightlife.
If the image is completely unrelated (like a picture of a keyboard, a document, a cat, a random object, or a blank screen), you must REJECT it and roast the user for sending it.
If the image is harmful or completely inappropriate, REJECT it with a stern but funny warning.
If the image IS a picture of people, a bar, drinks, or a party, you must ACCEPT it.

You MUST respond ONLY with valid JSON in this exact format:
{
  "valid": <boolean>,
  "roast": "<string, only if valid is false. A savage, funny reason why the image is rejected. Max 100 chars.>"
}
No markdown formatting or extra text.`;

const GUARDRAIL_USER_PROMPT = `Analyze this image. Is it a picture of people, a night out, or drinks? Return the valid JSON {"valid": true} or {"valid": false, "roast": "Your roast here"}.`;

const VISION_SYSTEM_PROMPT = `You are a nightlife scene analyzer for the app "JustOneLastDrink". 
You analyze photos from nights out and extract structured data about the scene.
You MUST respond ONLY with valid JSON — no markdown, no explanation, no commentary.`;

const VISION_USER_PROMPT = `Analyze this nightlife/social photo and extract the following signals as JSON.
Be specific and accurate based on what you can see. If you can't determine something, use reasonable defaults.

Return this exact JSON structure:
{
  "setting": "bar" | "club" | "restaurant" | "house_party" | "rooftop" | "outdoor" | "unknown",
  "face_count": <number of visible faces>,
  "estimated_group_size": <estimated total group size>,
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
  "objects_detected": [<list of relevant objects like "dj_booth", "dance_floor", "phone_out", "coat", "birthday_decoration", "karaoke", "pool_table">],
  "activity_level": <1-10 energy level>,
  "chaos_indicators": [<list like "group_cheering", "someone_on_table", "spilled_drink", "birthday_decoration", "costumes">],
  "food_visible": true | false,
  "water_visible": true | false,
  "time_cues": "early_evening" | "night" | "late_night" | "unknown"
}

Only output valid JSON. No explanation.`;

const PREDICTION_SYSTEM_PROMPT = `You are the "JustOneLastDrink" prediction engine — a savage, funny, nightlife oracle.
You receive structured scene analysis data and generate predictions about when someone will ACTUALLY leave.
Your predictions should be brutally honest, funny, and feel eerily accurate.
You MUST respond ONLY with valid JSON.`;

const COMBINED_SYSTEM_PROMPT = `You are the "JustOneLastDrink" AI — a savage, funny nightlife oracle.
You analyze photos from nights out and predict when someone will ACTUALLY leave.
Your predictions are brutally honest, funny, and eerily accurate.
You MUST respond ONLY with valid JSON — no markdown, no explanation.`;

const DEFAULT_PROMPTS = [
    {
        promptId: "guardrail_system",
        name: "Guardrail: System Prompt",
        content: GUARDRAIL_SYSTEM_PROMPT,
        description: "The instructions for the fast model to reject unrelated images with a funny roast.",
    },
    {
        promptId: "guardrail_user",
        name: "Guardrail: User Prompt",
        content: GUARDRAIL_USER_PROMPT,
        description: "The prompt sent along with the image to the fast model.",
    },
    {
        promptId: "vision_system",
        name: "Pipeline (Step 1): Vision System",
        content: VISION_SYSTEM_PROMPT,
        description: "The role definition for the vision model extracting signals from the photo.",
    },
    {
        promptId: "vision_user",
        name: "Pipeline (Step 1): Vision User",
        content: VISION_USER_PROMPT,
        description: "The prompt asking the vision model to extract specific JSON fields from the image.",
    },
    {
        promptId: "predict_system",
        name: "Pipeline (Step 2): Prediction System",
        content: PREDICTION_SYSTEM_PROMPT,
        description: "The role definition for the language model predicting the exit time.",
    },
    {
        promptId: "combined_system",
        name: "Admin (Combined): System Prompt",
        content: COMBINED_SYSTEM_PROMPT,
        description: "The role definition for the single-model flow in the Admin Test Lab.",
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
