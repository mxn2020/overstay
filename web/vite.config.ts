import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 50 },
    },
  },
    plugins: [react()],
    server: {
        host: '127.0.0.1',
        port: 5185,
        hmr: {
            clientPort: 5185,
        },
    }
})
