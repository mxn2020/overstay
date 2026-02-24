import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Server-side proxy for NVIDIA NIM API
// Keeps NVIDIA_API_KEY on the server — never exposed to the browser
function nvidiaProxy(): Plugin {
    let apiKey: string | undefined

    return {
        name: 'nvidia-api-proxy',
        configureServer(server) {
            // Load non-VITE_ env vars (server-only)
            const env = loadEnv('', process.cwd(), '')
            apiKey = env.NVIDIA_API_KEY

            server.middlewares.use('/api/nvidia', async (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405
                    res.end(JSON.stringify({ error: 'Method not allowed' }))
                    return
                }

                if (!apiKey) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({
                        error: 'NVIDIA_API_KEY is not set. Get a free key at https://build.nvidia.com and add it to .env.local',
                    }))
                    return
                }

                // Read request body
                const chunks: Buffer[] = []
                for await (const chunk of req) {
                    chunks.push(chunk as Buffer)
                }
                const body = Buffer.concat(chunks).toString()

                try {
                    // Forward to NVIDIA NIM API with the secret key
                    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body,
                    })

                    const data = await response.text()
                    res.statusCode = response.status
                    res.setHeader('Content-Type', 'application/json')
                    res.end(data)
                } catch (err) {
                    console.error('[nvidia-proxy] Error:', err)
                    res.statusCode = 502
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Failed to reach NVIDIA API' }))
                }
            })
        },
    }
}

export default defineConfig({
    plugins: [react(), nvidiaProxy()],
})
