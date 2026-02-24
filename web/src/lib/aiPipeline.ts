// AI Pipeline Orchestrator
// Supports three modes via VITE_AI_PIPELINE env variable:
//   "two-model"    → Kimi K2.5 (vision) + Nemotron Nano (prediction)
//   "single-model" → Kimi K2.5 (vision + prediction in one call)
//   "demo"         → Local random scoring (default, no API key needed)

import { callNvidiaModel, fileToBase64 } from './nvidiaApi'
import {
    VISION_SYSTEM_PROMPT,
    VISION_USER_PROMPT,
    PREDICTION_SYSTEM_PROMPT,
    buildPredictionUserPrompt,
    COMBINED_SYSTEM_PROMPT,
    buildCombinedUserPrompt,
} from './aiPrompts'
import { analyzeImageLocally, type LocalPredictionResult } from './localScoring'

// NVIDIA NIM model identifiers
const MODEL_VISION = 'moonshotai/kimi-k2.5'
const MODEL_PREDICTION = 'nvidia/nemotron-3-nano-30b-a3b'

export type PipelineMode = 'two-model' | 'single-model' | 'demo'

export function getPipelineMode(): PipelineMode {
    const mode = import.meta.env.VITE_AI_PIPELINE as string | undefined
    if (mode === 'two-model' || mode === 'single-model') return mode
    return 'demo'
}

export function hasNvidiaApiKey(): boolean {
    return Boolean(import.meta.env.VITE_NVIDIA_API_KEY)
}

function parseJsonResponse(raw: string): Record<string, unknown> {
    // Strip markdown code fences if the model wraps its response
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    return JSON.parse(cleaned)
}

// ============================================
// Option A: Two-Model Pipeline
// Kimi K2.5 → extracts scene signals
// Nemotron-3-Nano → generates prediction from signals
// ============================================
async function runTwoModelPipeline(file: File): Promise<LocalPredictionResult> {
    console.log('[AI Pipeline] Running two-model pipeline: Kimi K2.5 → Nemotron Nano')

    // Step 1: Convert image to base64
    const base64 = await fileToBase64(file)

    // Step 2: Kimi K2.5 — Analyze the image
    console.log('[AI Pipeline] Step 1/2: Kimi K2.5 analyzing image...')
    const visionResponse = await callNvidiaModel(MODEL_VISION, [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        {
            role: 'user',
            content: [
                { type: 'text', text: VISION_USER_PROMPT },
                { type: 'image_url', image_url: { url: base64 } },
            ],
        },
    ], {
        temperature: 0.3, // Lower temp for factual analysis
        maxTokens: 1024,
    })

    console.log('[AI Pipeline] Vision signals received:', visionResponse.substring(0, 200))
    const visionSignals = parseJsonResponse(visionResponse)

    // Step 3: Nemotron Nano — Generate prediction from signals
    console.log('[AI Pipeline] Step 2/2: Nemotron Nano generating prediction...')
    const predictionResponse = await callNvidiaModel(MODEL_PREDICTION, [
        { role: 'system', content: PREDICTION_SYSTEM_PROMPT },
        { role: 'user', content: buildPredictionUserPrompt(JSON.stringify(visionSignals, null, 2)) },
    ], {
        temperature: 0.8, // Higher temp for creative roast lines
        maxTokens: 1024,
    })

    console.log('[AI Pipeline] Prediction received:', predictionResponse.substring(0, 200))
    const prediction = parseJsonResponse(predictionResponse)

    return {
        predictionId: `nvidia-2m-${Date.now()}`,
        exitTime: prediction.exitTime as string,
        overstayMinutes: prediction.overstayMinutes as number,
        chaosRating: prediction.chaosRating as number,
        textRegret: prediction.textRegret as number,
        barHop: prediction.barHop as number,
        cryRisk: prediction.cryRisk as number,
        sunriseRisk: prediction.sunriseRisk as string,
        roastLine: prediction.roastLine as string,
    }
}

// ============================================
// Option B: Single-Model Pipeline
// Kimi K2.5 → analyzes AND predicts in one call
// ============================================
async function runSingleModelPipeline(file: File): Promise<LocalPredictionResult> {
    console.log('[AI Pipeline] Running single-model pipeline: Kimi K2.5 (analyze + predict)')

    // Step 1: Convert image to base64
    const base64 = await fileToBase64(file)

    // Step 2: Kimi K2.5 — Analyze and predict in one call
    const response = await callNvidiaModel(MODEL_VISION, [
        { role: 'system', content: COMBINED_SYSTEM_PROMPT },
        {
            role: 'user',
            content: [
                { type: 'text', text: buildCombinedUserPrompt() },
                { type: 'image_url', image_url: { url: base64 } },
            ],
        },
    ], {
        temperature: 0.7,
        maxTokens: 2048,
    })

    console.log('[AI Pipeline] Combined response:', response.substring(0, 200))
    const result = parseJsonResponse(response)

    // Extract from nested "prediction" key
    const pred = (result.prediction ?? result) as Record<string, unknown>

    return {
        predictionId: `nvidia-1m-${Date.now()}`,
        exitTime: pred.exitTime as string,
        overstayMinutes: pred.overstayMinutes as number,
        chaosRating: pred.chaosRating as number,
        textRegret: pred.textRegret as number,
        barHop: pred.barHop as number,
        cryRisk: pred.cryRisk as number,
        sunriseRisk: pred.sunriseRisk as string,
        roastLine: pred.roastLine as string,
    }
}

// ============================================
// Main entry point — routes to correct pipeline
// ============================================
export async function analyzeImage(file: File): Promise<LocalPredictionResult> {
    const mode = getPipelineMode()

    switch (mode) {
        case 'two-model':
            return runTwoModelPipeline(file)
        case 'single-model':
            return runSingleModelPipeline(file)
        case 'demo':
        default:
            return analyzeImageLocally()
    }
}
