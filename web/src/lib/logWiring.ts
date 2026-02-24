// Wire the NVIDIA API log callback to Convex
// This should be called once when the app mounts with Convex

import { setLogCallback, type AiLogEntry } from './nvidiaApi'
import type { ConvexReactClient } from 'convex/react'

export function wireLogCallback(convex: ConvexReactClient) {
    setLogCallback(async (entry: AiLogEntry) => {
        try {
            // Dynamic import to avoid circular dependencies
            const { api } = await import('../../convex/_generated/api')
            await convex.mutation(api.aiLogs.saveLog, entry)
            console.log(`[AI Log] Saved to Convex: ${entry.requestId}`)
        } catch (err) {
            console.warn('[AI Log] Failed to save to Convex:', err)
        }
    })
}
