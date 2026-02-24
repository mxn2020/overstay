// AI Pipeline Orchestrator
// Supports three modes via VITE_AI_PIPELINE env variable:
//   "two-model"    → Kimi K2.5 (vision) + Nemotron Nano (prediction)
//   "single-model" → Kimi K2.5 (vision + prediction in one call)
//   "demo"         → Local random scoring (default, no API key needed)

import { fileToBase64 } from './nvidiaApi'
import { analyzeImageLocally, type LocalPredictionResult } from './localScoring'
import { convex } from './convexClient'
import { api } from '../../convex/_generated/api'

// Backend handles model identifiers and exact prompts automatically now.

export type PipelineMode = 'two-model' | 'single-model' | 'demo'

export function getPipelineMode(): PipelineMode {
    const mode = import.meta.env.VITE_AI_PIPELINE as string | undefined
    if (mode === 'two-model' || mode === 'single-model') return mode
    return 'demo'
}

// Removed parseJsonResponse as backend handles parsing

// ============================================
// Option A: Two-Model Pipeline
// Kimi K2.5 → extracts scene signals
// Nemotron-3-Nano → generates prediction from signals
// ============================================
async function runTwoModelPipeline(file: File): Promise<LocalPredictionResult> {
    if (!convex) throw new Error("Convex client not initialized")

    const base64 = await fileToBase64(file)
    const prediction: any = await convex.action(api.nvidia.runPipeline, { imageBase64: base64, mode: 'single' })

    return {
        predictionId: `nvidia-2m-${Date.now()}`,
        exitTime: prediction.exitTime,
        overstayMinutes: prediction.overstayMinutes,
        chaosRating: prediction.chaosRating,
        textRegret: prediction.textRegret,
        barHop: prediction.barHop,
        cryRisk: prediction.cryRisk,
        sunriseRisk: prediction.sunriseRisk,
        roastLine: prediction.roastLine,
    }
}

// ============================================
// Option B: Single-Model Pipeline
// Kimi K2.5 → analyzes AND predicts in one call
// ============================================
async function runSingleModelPipeline(file: File): Promise<LocalPredictionResult> {
    if (!convex) throw new Error("Convex client not initialized")

    const base64 = await fileToBase64(file)
    const pred: any = await convex.action(api.nvidia.runPipeline, { imageBase64: base64, mode: 'combined' })

    return {
        predictionId: `nvidia-1m-${Date.now()}`,
        exitTime: pred.exitTime,
        overstayMinutes: pred.overstayMinutes,
        chaosRating: pred.chaosRating,
        textRegret: pred.textRegret,
        barHop: pred.barHop,
        cryRisk: pred.cryRisk,
        sunriseRisk: pred.sunriseRisk,
        roastLine: pred.roastLine,
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
