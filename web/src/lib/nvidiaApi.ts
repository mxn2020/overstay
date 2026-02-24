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
    // Route through server-side proxy — API key is injected there, never in the browser
    const response = await fetch('/api/nvidia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
            top_p: options.topP ?? 0.9,
            stream: false,
        }),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(
            `NVIDIA API error (${response.status}): ${(errorData as { error?: string }).error ?? JSON.stringify(errorData)}`
        )
    }

    const data = (await response.json()) as NvidiaChatResponse
    return data.choices[0]?.message?.content ?? ''
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
