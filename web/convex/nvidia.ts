import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const callModel = action({
    args: {
        model: v.string(),
        messages: v.any(), // Array of NvidiaMessage
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        topP: v.optional(v.number()),
        caller: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        return await performNvidiaCall(ctx, args);
    },
});

export const runPipeline = action({
    args: {
        imageBase64: v.string(),
        mode: v.union(v.literal("single"), v.literal("combined")), // single = 2-models, combined = 1-model
    },
    handler: async (ctx, args) => {
        const { imageBase64, mode } = args;

        // --- STEP 0: GUARDRAIL CHECK ---
        // Model token limits (NVIDIA API):
        //   moonshotai/kimi-k2.5:                context 256k, max output 8,192
        //   microsoft/phi-4-multimodal-instruct:  context 128k, max output 4,000
        //   nvidia/nemotron-3-nano-30b-a3b:       context 262k, max output 8,192
        const GUARDRAIL_MODEL = 'microsoft/phi-4-multimodal-instruct'; // Fast! ~1s vs kimi's ~287s
        const guardrailSystem = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "guardrail_system" });
        const guardrailUser = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "guardrail_user" });

        if (!guardrailSystem || !guardrailUser) throw new Error("Guardrail prompts not found in DB");

        const guardrailResponse = await performNvidiaCall(ctx, {
            model: GUARDRAIL_MODEL,
            messages: [
                { role: 'system', content: guardrailSystem },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: guardrailUser },
                        { type: 'image_url', image_url: { url: imageBase64 } },
                    ],
                },
            ],
            temperature: 0.1,
            maxTokens: 512, // Small JSON response only — phi-4 is fast
            caller: 'pipeline:guardrail',
        });

        const guardrailData = parseJsonResponse(guardrailResponse);
        if (guardrailData?.valid === false) {
            // Guardrail failed! Reject early.
            return {
                rejected: true,
                reason: guardrailData.reason || "roast", // "roast" = funny, "harmful" = inappropriate
                rejectReason: guardrailData.roast || "Invalid image rejected by AI guardrails."
            };
        }

        // --- GUARDRAIL PASSED. PROCEED TO PIPELINE ---

        if (mode === "single") {
            // "Vision Only" mode (2 models: Kimi K2.5 -> Nemotron-3-Nano)
            const MODEL_VISION = 'moonshotai/kimi-k2.5'           // max output: 8,192
            const MODEL_PREDICTION = 'nvidia/nemotron-3-nano-30b-a3b' // max output: 8,192

            const visionSystem = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "vision_system" }) || "";
            const visionUser = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "vision_user" }) || "";
            const predictSystem = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "predict_system" }) || "";

            // Step 1: Vision
            const visionResponse = await performNvidiaCall(ctx, {
                model: MODEL_VISION,
                messages: [
                    { role: 'system', content: visionSystem },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: visionUser },
                            { type: 'image_url', image_url: { url: imageBase64 } },
                        ],
                    },
                ],
                temperature: 0.3,
                maxTokens: 8192, // kimi-k2.5 max output on NVIDIA API
                caller: 'pipeline:two-model:vision',
            });

            const visionSignals = parseJsonResponse(visionResponse);

            // Step 2: Predict
            const predictionResponse = await performNvidiaCall(ctx, {
                model: MODEL_PREDICTION,
                messages: [
                    { role: 'system', content: predictSystem },
                    { role: 'user', content: buildPredictionUserPrompt(JSON.stringify(visionSignals, null, 2)) },
                ],
                temperature: 0.8,
                maxTokens: 8192, // nemotron-3-nano max output on NVIDIA API
                caller: 'pipeline:two-model:prediction',
            });

            return parseJsonResponse(predictionResponse);
        } else {
            // "Combined" mode (1 model: Kimi K2.5)
            const MODEL_VISION = 'moonshotai/kimi-k2.5'           // max output: 8,192
            const combinedSystem = await ctx.runQuery(internal.prompts.getPromptContent, { promptId: "combined_system" }) || "";

            const response = await performNvidiaCall(ctx, {
                model: MODEL_VISION,
                messages: [
                    { role: 'system', content: combinedSystem },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: buildCombinedUserPrompt() },
                            { type: 'image_url', image_url: { url: imageBase64 } },
                        ],
                    },
                ],
                temperature: 0.7,
                maxTokens: 8192, // kimi-k2.5 max output on NVIDIA API
                caller: 'pipeline:single-model',
            });

            const parsed = parseJsonResponse(response);
            return parsed.prediction || parsed; // Handle nested structure if single model returns { analysis, prediction }
        }
    }
});

function parseJsonResponse(raw: string): any {
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    try {
        return JSON.parse(cleaned)
    } catch (e) {
        console.error('[AI Pipeline] Failed to parse JSON:', cleaned, e)
        throw new Error('AI returned invalid JSON')
    }
}

// Extract text-only content from messages (strip base64 images for log readability)
function extractPromptText(messages: any[]): {
    systemPrompt: string
    userPromptText: string
    hasImage: boolean
    imageSizeBytes: number
} {
    let systemPrompt = ''
    let userPromptText = ''
    let hasImage = false
    let imageSizeBytes = 0

    for (const msg of messages) {
        if (typeof msg.content === 'string') {
            if (msg.role === 'system') systemPrompt = msg.content
            else userPromptText = msg.content
        } else if (Array.isArray(msg.content)) {
            for (const part of msg.content) {
                if (part.type === 'text' && part.text) {
                    if (msg.role === 'system') systemPrompt = part.text
                    else userPromptText += part.text
                }
                if (part.type === 'image_url' && part.image_url?.url) {
                    hasImage = true
                    imageSizeBytes = part.image_url.url.length
                }
            }
        }
    }

    return { systemPrompt, userPromptText, hasImage, imageSizeBytes }
}

async function performNvidiaCall(ctx: any, args: {
    model: string,
    messages: any[],
    temperature?: number,
    maxTokens?: number,
    topP?: number,
    caller?: string
}): Promise<string> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        throw new Error("NVIDIA_API_KEY is not configured in Convex environment variables.");
    }

    const { model, messages, temperature = 0.7, maxTokens = 2048, topP = 0.9, caller = 'unknown' } = args;
    const bodyObj = { model, messages, temperature, max_tokens: maxTokens, top_p: topP, stream: false };
    const bodyStr = JSON.stringify(bodyObj);
    const requestBodySize = bodyStr.length;
    const promptInfo = extractPromptText(messages);

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = Date.now();

    let httpStatus = 0;
    let responseContent = '';
    let finishReason: string | undefined;
    let promptTokens: number | undefined;
    let completionTokens: number | undefined;
    let totalTokens: number | undefined;
    let errorMessage: string | undefined;
    let status: 'success' | 'error' = 'success';

    console.log(`[NVIDIA API Action] [${requestId}] Calling model: ${model} (caller: ${caller})`);

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: bodyStr,
        });

        httpStatus = response.status;
        if (!response.ok) {
            const errorText = await response.text();
            status = 'error';
            errorMessage = errorText.substring(0, 2000);
            throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as any;
        responseContent = data.choices?.[0]?.message?.content ?? '';
        finishReason = data.choices?.[0]?.finish_reason;
        promptTokens = data.usage?.prompt_tokens;
        completionTokens = data.usage?.completion_tokens;
        totalTokens = data.usage?.total_tokens;

        if (!responseContent) {
            status = 'error';
            errorMessage = `Empty content. Finish: ${finishReason}, Tokens: ${completionTokens}`;
            throw new Error(errorMessage);
        }

        return responseContent;
    } catch (err) {
        if (status !== 'error') {
            status = 'error';
            errorMessage = err instanceof Error ? err.message : 'Unknown error';
        }
        throw err;
    } finally {
        const durationMs = Date.now() - timestamp;

        try {
            await ctx.runMutation(internal.aiLogs.saveLog, {
                requestId,
                model,
                caller,
                timestamp,
                durationMs,
                systemPrompt: promptInfo.systemPrompt.substring(0, 2000),
                userPromptText: promptInfo.userPromptText.substring(0, 2000),
                hasImage: promptInfo.hasImage,
                imageSizeBytes: promptInfo.imageSizeBytes || undefined,
                temperature,
                maxTokens,
                requestBodySize,
                status,
                httpStatus,
                responseContent: responseContent.substring(0, 8000),
                responseSize: responseContent.length,
                finishReason,
                promptTokens,
                completionTokens,
                totalTokens,
                errorMessage,
            });
        } catch (logErr) {
            console.error("[NVIDIA API Action] Failed to save log entry:", logErr);
        }
    }
}

function buildPredictionUserPrompt(visionSignals: string): string {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return `Based on these scene analysis signals from a night-out photo, generate a prediction.
Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}

Scene signals:
${visionSignals}

Generate this JSON:
{
  "exitTime": "<predicted time they'll actually leave, e.g. '2:47 AM'>",
  "overstayMinutes": <minutes from now until they leave>,
  "chaosRating": <0.0-10.0 chaos level>,
  "textRegret": <0-100 % chance they'll send a regrettable text>,
  "barHop": <0-100 % chance they'll hop to another bar>,
  "cryRisk": <0-100 % chance someone cries>,
  "sunriseRisk": "LOW" | "MEDIUM" | "HIGH" | "CERTAIN",
  "roastLine": "<one savage, funny line about their night. Be creative and specific to what you see in the data. Max 80 chars.>"
}

Rules for predictions:
- Clubs and house parties = longer stays
- More drinks, especially shots = way longer
- Groups > 4 people = they're not leaving
- Packed venues with neon/strobes = sunrise risk goes up
- If someone has a coat in sight, they might actually leave
- Food and water = responsible humans, maybe they DO leave on time
- "Just one last drink" is ALWAYS a lie
- Be savage but funny with the roast line

Only output valid JSON.`
}

function buildCombinedUserPrompt(): string {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return `Look at this night-out photo. Analyze the scene and predict when this person/group will ACTUALLY leave.
Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}

Generate this JSON with your analysis AND prediction combined:
{
  "analysis": {
    "setting": "bar" | "club" | "restaurant" | "house_party" | "rooftop" | "outdoor" | "unknown",
    "face_count": <number>,
    "estimated_group_size": <number>,
    "drinks_count": <number>,
    "drink_types": ["beer", "cocktail", "shot", "wine"],
    "empty_glasses": <number>,
    "lighting": "dark" | "dim" | "moderate" | "bright",
    "neon_or_strobes": true | false,
    "crowd_density": "empty" | "sparse" | "moderate" | "packed",
    "vibe": "calm" | "happy" | "excited" | "wild" | "emotional" | "tired",
    "energy_level": <1-10>,
    "chaos_signs": [<list of chaos indicators>]
  },
  "prediction": {
    "exitTime": "<predicted time, e.g. '2:47 AM'>",
    "overstayMinutes": <minutes from now until they leave>,
    "chaosRating": <0.0-10.0>,
    "textRegret": <0-100>,
    "barHop": <0-100>,
    "cryRisk": <0-100>,
    "sunriseRisk": "LOW" | "MEDIUM" | "HIGH" | "CERTAIN",
    "roastLine": "<savage, funny one-liner about their night. Max 80 chars.>"
  }
}

Rules:
- "Just one last drink" is ALWAYS a lie
- More people + more drinks = they're definitely not leaving
- Clubs/house parties = add hours
- Shots visible = sunrise risk goes way up
- Be savage but funny with the roast line
- exitTime should be realistic based on the current time and scene

Only output valid JSON.`
}
