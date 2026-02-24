import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
    VISION_SYSTEM_PROMPT,
    VISION_USER_PROMPT,
    PREDICTION_SYSTEM_PROMPT,
    buildPredictionUserPrompt,
    COMBINED_SYSTEM_PROMPT,
    buildCombinedUserPrompt
} from "./aiPrompts";

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

        if (mode === "single") {
            // "Vision Only" mode in admin (2 models: Kimi K2.5 -> Nemotron-3-Nano)
            const MODEL_VISION = 'moonshotai/kimi-k2.5'
            const MODEL_PREDICTION = 'nvidia/nemotron-3-nano-30b-a3b'

            // Step 1: Vision
            const visionResponse = await performNvidiaCall(ctx, {
                model: MODEL_VISION,
                messages: [
                    { role: 'system', content: VISION_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: VISION_USER_PROMPT },
                            { type: 'image_url', image_url: { url: imageBase64 } },
                        ],
                    },
                ],
                temperature: 0.3,
                maxTokens: 4096,
                caller: 'pipeline:two-model:vision',
            });

            // Parse exactly like aiPipeline.ts
            const visionSignals = parseJsonResponse(visionResponse);

            // Step 2: Predict
            const predictionResponse = await performNvidiaCall(ctx, {
                model: MODEL_PREDICTION,
                messages: [
                    { role: 'system', content: PREDICTION_SYSTEM_PROMPT },
                    { role: 'user', content: buildPredictionUserPrompt(JSON.stringify(visionSignals, null, 2)) },
                ],
                temperature: 0.8,
                maxTokens: 2048,
                caller: 'pipeline:two-model:prediction',
            });

            return parseJsonResponse(predictionResponse);
        } else {
            // "Combined" mode in admin (1 model: Kimi K2.5)
            const MODEL_VISION = 'moonshotai/kimi-k2.5'

            const response = await performNvidiaCall(ctx, {
                model: MODEL_VISION,
                messages: [
                    { role: 'system', content: COMBINED_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: buildCombinedUserPrompt() },
                            { type: 'image_url', image_url: { url: imageBase64 } },
                        ],
                    },
                ],
                temperature: 0.7,
                maxTokens: 2048,
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
