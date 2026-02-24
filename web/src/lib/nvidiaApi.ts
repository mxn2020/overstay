// NVIDIA NIM API Client
// Calls go through /api/nvidia server-side proxy (keeps API key secret)
// In production, replace with Convex actions or serverless functions

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

export async function callNvidiaModel(
    model: string,
    messages: NvidiaMessage[],
    options: {
        temperature?: number
        maxTokens?: number
        topP?: number
    } = {}
): Promise<string> {
    console.log(`[NVIDIA API] Calling model: ${model}`)
    console.log(`[NVIDIA API] Messages: ${messages.length} messages, first role: ${messages[0]?.role}`)

    const body = JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 0.9,
        stream: false,
    })
    console.log(`[NVIDIA API] Request body size: ${body.length} bytes`)

    // Route through server-side proxy — API key is injected there, never in the browser
    const response = await fetch('/api/nvidia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body,
    })

    console.log(`[NVIDIA API] Response status: ${response.status}`)

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`[NVIDIA API] Error response:`, errorText)
        throw new Error(
            `NVIDIA API error (${response.status}): ${errorText}`
        )
    }

    const data = (await response.json()) as NvidiaChatResponse
    console.log('[NVIDIA API] Raw response:', JSON.stringify(data, null, 2).substring(0, 1000))
    const content = data.choices[0]?.message?.content ?? ''
    console.log(`[NVIDIA API] Response content length: ${content.length} chars`)
    console.log(`[NVIDIA API] Content preview: ${content.substring(0, 300)}`)
    console.log(`[NVIDIA API] Usage:`, data.usage)
    if (!content) {
        console.error('[NVIDIA API] WARNING: Empty content! Full choice:', JSON.stringify(data.choices[0]))
        throw new Error(`NVIDIA API returned empty content. Finish reason: ${data.choices[0]?.finish_reason}. Tokens used: ${data.usage?.completion_tokens}`)
    }
    return content
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
