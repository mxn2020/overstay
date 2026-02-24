// NVIDIA NIM API Client
// Calls go through /api/nvidia server-side proxy (keeps API key secret)
// Every call is logged to Convex aiLogs for audit trail

export interface NvidiaMessage {
    role: 'system' | 'user' | 'assistant'
    content: string | NvidiaContentPart[]
}

export interface NvidiaContentPart {
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
        url: string // base64 data URI or URL
    }
}

export interface NvidiaChatResponse {
    id: string
    choices: {
        index: number
        message: {
            role: string
            content: string
        }
        finish_reason: string
    }[]
    usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

// Audit log entry for every API call
export interface AiLogEntry {
    requestId: string
    model: string
    caller: string
    timestamp: number
    durationMs: number
    systemPrompt: string
    userPromptText: string
    hasImage: boolean
    imageSizeBytes?: number
    temperature: number
    maxTokens: number
    requestBodySize: number
    status: 'success' | 'error'
    httpStatus: number
    responseContent: string
    responseSize: number
    finishReason?: string
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    errorMessage?: string
}

// Log callback — set by the app to persist logs to Convex
let _logCallback: ((entry: AiLogEntry) => void) | null = null

export function setLogCallback(cb: (entry: AiLogEntry) => void) {
    _logCallback = cb
}

// Extract text-only content from messages (strip base64 images for log readability)
function extractPromptText(messages: NvidiaMessage[]): {
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

export async function callNvidiaModel(
    model: string,
    messages: NvidiaMessage[],
    options: {
        temperature?: number
        maxTokens?: number
        topP?: number
        caller?: string  // Who triggered this call (e.g., 'pipeline', 'admin-test')
    } = {}
): Promise<string> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const timestamp = Date.now()
    const caller = options.caller ?? 'unknown'
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens ?? 2048

    console.log(`[NVIDIA API] [${requestId}] Calling model: ${model} (caller: ${caller})`)

    const body = JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: options.topP ?? 0.9,
        stream: false,
    })

    const requestBodySize = body.length
    console.log(`[NVIDIA API] [${requestId}] Request body: ${requestBodySize} bytes`)

    const promptInfo = extractPromptText(messages)

    let httpStatus = 0
    let responseContent = ''
    let finishReason: string | undefined
    let promptTokens: number | undefined
    let completionTokens: number | undefined
    let totalTokens: number | undefined
    let errorMessage: string | undefined
    let status: 'success' | 'error' = 'success'

    try {
        const response = await fetch('/api/nvidia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        })

        httpStatus = response.status
        console.log(`[NVIDIA API] [${requestId}] Response status: ${httpStatus}`)

        if (!response.ok) {
            const errorText = await response.text()
            status = 'error'
            errorMessage = errorText.substring(0, 2000)
            throw new Error(`NVIDIA API error (${response.status}): ${errorText}`)
        }

        const data = (await response.json()) as NvidiaChatResponse
        responseContent = data.choices[0]?.message?.content ?? ''
        finishReason = data.choices[0]?.finish_reason
        promptTokens = data.usage?.prompt_tokens
        completionTokens = data.usage?.completion_tokens
        totalTokens = data.usage?.total_tokens

        if (!responseContent) {
            status = 'error'
            errorMessage = `Empty content. Finish: ${finishReason}, Tokens: ${completionTokens}`
            throw new Error(errorMessage)
        }

        return responseContent
    } catch (err) {
        if (status !== 'error') {
            status = 'error'
            errorMessage = err instanceof Error ? err.message : 'Unknown error'
        }
        throw err
    } finally {
        const durationMs = Date.now() - timestamp

        // Always log, success or error
        const logEntry: AiLogEntry = {
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
        }

        console.log(`[NVIDIA API] [${requestId}] ${status} in ${durationMs}ms | ${totalTokens ?? 0} tokens`)

        if (_logCallback) {
            try { _logCallback(logEntry) } catch { /* don't fail on log save */ }
        }
    }
}

// Convert a File to base64 data URI
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
