// NVIDIA NIM Model Registry — All Image-to-Text models available on build.nvidia.com

export interface ModelInfo {
    id: string           // NVIDIA NIM model identifier
    name: string         // Human-readable name
    publisher: string    // Model publisher
    size: string         // Parameter count / size description
    tags: string[]       // Model tags
    geoRestricted?: boolean // Some Meta models are geo-restricted
}

export const VISION_MODELS: ModelInfo[] = [
    {
        id: 'moonshotai/kimi-k2.5',
        name: 'Kimi K2.5',
        publisher: 'Moonshot AI',
        size: '1T MoE (32B active)',
        tags: ['Multimodal', 'Reasoning', 'MoE'],
    },
    {
        id: 'mistralai/mistral-large-3-675b-instruct-2512',
        name: 'Mistral Large 3',
        publisher: 'Mistral',
        size: '675B MoE',
        tags: ['Language Generation', 'Chat'],
    },
    {
        id: 'mistralai/ministral-14b-instruct-2512',
        name: 'Ministral 14B',
        publisher: 'Mistral',
        size: '14B',
        tags: ['SLM', 'Chat'],
    },
    {
        id: 'nvidia/nemotron-nano-12b-v2-vl',
        name: 'Nemotron Nano 12B VL',
        publisher: 'NVIDIA',
        size: '12B',
        tags: ['Language Generation', 'Multi-Image', 'Video'],
    },
    {
        id: 'meta/llama-4-maverick-17b-128e-instruct',
        name: 'Llama 4 Maverick',
        publisher: 'Meta',
        size: '17B 128E MoE',
        tags: ['Language Generation', 'Multilingual'],
    },
    {
        id: 'meta/llama-4-scout-17b-16e-instruct',
        name: 'Llama 4 Scout',
        publisher: 'Meta',
        size: '17B 16E MoE',
        tags: ['Language Generation', 'Multilingual'],
    },
    {
        id: 'mistralai/mistral-medium-3-instruct',
        name: 'Mistral Medium 3',
        publisher: 'Mistral',
        size: 'Medium',
        tags: ['Language Generation', 'Enterprise'],
    },
    {
        id: 'meta/llama-3.2-90b-vision-instruct',
        name: 'Llama 3.2 90B Vision',
        publisher: 'Meta',
        size: '90B',
        tags: ['Visual QA', 'Image Captioning'],
        geoRestricted: true,
    },
    {
        id: 'meta/llama-3.2-11b-vision-instruct',
        name: 'Llama 3.2 11B Vision',
        publisher: 'Meta',
        size: '11B',
        tags: ['Visual QA', 'Image Captioning'],
        geoRestricted: true,
    },
    {
        id: 'google/gemma-3-27b-it',
        name: 'Gemma 3 27B IT',
        publisher: 'Google',
        size: '27B',
        tags: ['Vision Assistant', 'VQA'],
    },
    {
        id: 'microsoft/phi-4-multimodal-instruct',
        name: 'Phi-4 Multimodal',
        publisher: 'Microsoft',
        size: 'Phi-4',
        tags: ['Visual QA', 'Speech'],
    },
    {
        id: 'microsoft/phi-3.5-vision-instruct',
        name: 'Phi-3.5 Vision',
        publisher: 'Microsoft',
        size: 'Phi-3.5',
        tags: ['Vision Assistant', 'VQA'],
    },
    {
        id: 'google/paligemma',
        name: 'PaliGemma',
        publisher: 'Google',
        size: 'PaliGemma',
        tags: ['VLM', 'Image Captioning'],
    },
]

// Text-only models for the prediction step (two-model pipeline)
export const PREDICTION_MODELS: ModelInfo[] = [
    {
        id: 'nvidia/nemotron-3-nano-30b-a3b',
        name: 'Nemotron-3 Nano 30B',
        publisher: 'NVIDIA',
        size: '30B MoE (3B active)',
        tags: ['Reasoning', 'Instruction Following'],
    },
    {
        id: 'deepseek-ai/deepseek-v3.1',
        name: 'DeepSeek V3.1',
        publisher: 'DeepSeek',
        size: '685B MoE',
        tags: ['Reasoning', 'Long Context'],
    },
]

export function getModelById(id: string): ModelInfo | undefined {
    return [...VISION_MODELS, ...PREDICTION_MODELS].find(m => m.id === id)
}
