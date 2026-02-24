// NVIDIA NIM API Client
// All models use OpenAI-compatible chat completions endpoint

const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1'

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
    const apiKey = import.meta.env.VITE_NVIDIA_API_KEY as string

    if (!apiKey) {
        throw new Error('VITE_NVIDIA_API_KEY is not set. Get a free key at https://build.nvidia.com')
    }

    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
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
        const errorText = await response.text()
        throw new Error(`NVIDIA API error (${response.status}): ${errorText}`)
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
