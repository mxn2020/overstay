import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/i18n'
import App from './App'
import { getRandomTheme, applyTheme } from './lib/colorThemes'
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ToastProvider } from './components/Toast'

// Apply a random color theme on each visit
const theme = getRandomTheme()
applyTheme(theme)

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const root = createRoot(document.getElementById('root')!);

if (!convexUrl) {
    root.render(
        <StrictMode>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0A0A0F',
                fontFamily: "'Inter', system-ui, sans-serif",
                color: '#F8FAFC',
                padding: 24,
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1A0A2E 0%, #0A0A0F 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: 24,
                    padding: 48,
                    maxWidth: 420,
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Backend Not Connected</h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginBottom: 24 }}>
                        JustOneLastDrink requires a Convex backend to function.
                    </p>
                    <div style={{
                        background: 'rgba(26, 10, 46, 0.6)',
                        border: '1px solid rgba(139, 92, 246, 0.15)',
                        borderRadius: 8,
                        padding: '14px 18px',
                        textAlign: 'left',
                        fontSize: 13,
                        color: '#94A3B8',
                        lineHeight: 1.8,
                    }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Setup required:</div>
                        <div>1. Set <code style={{ background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: 4 }}>VITE_CONVEX_URL</code> in your <code style={{ background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: 4 }}>.env.local</code></div>
                        <div>2. Redeploy or restart the dev server</div>
                    </div>
                    <p style={{ marginTop: 16, fontSize: 11, color: '#64748B' }}>
                        Run <code style={{ background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: 4 }}>npx convex dev</code> to get your URL
                    </p>
                </div>
            </div>
        </StrictMode>
    );
} else {
    const convex = new ConvexReactClient(convexUrl);
    root.render(
        <StrictMode>
            <ConvexAuthProvider client={convex}>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </ConvexAuthProvider>
        </StrictMode>,
    );
}
