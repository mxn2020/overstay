import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { getRandomTheme, applyTheme } from './lib/colorThemes'

// Apply a random color theme on each visit
// "You were too drunk to remember the last color"
const theme = getRandomTheme()
applyTheme(theme)

// Convex is optional — when VITE_CONVEX_URL is set, it wraps with ConvexProvider
// Otherwise the app runs in demo mode with local scoring
import { convex } from './lib/convexClient'

async function mount() {
    const root = createRoot(document.getElementById('root')!)

    if (convex) {
        const { ConvexProvider } = await import('convex/react')
        root.render(
            <StrictMode>
                <ConvexProvider client={convex}>
                    <App useConvex={true} />
                </ConvexProvider>
            </StrictMode>,
        )
    } else {
        root.render(
            <StrictMode>
                <App useConvex={false} />
            </StrictMode>,
        )
    }
}

mount()
