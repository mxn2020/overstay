import { useState, useEffect, type ReactNode } from 'react'
import { getRandomRide, getRandomSafetyMessage } from '../lib/safeRide'

interface LayoutProps {
    children: ReactNode
    onNavigateHome: () => void
    onNavigateProfile: () => void
    onNavigateAdmin?: () => void
    onNavigateLogs?: () => void
}

export default function Layout({ children, onNavigateHome, onNavigateProfile, onNavigateAdmin, onNavigateLogs }: LayoutProps) {
    const [safetyMessage, setSafetyMessage] = useState(getRandomSafetyMessage())
    const [ride, setRide] = useState(getRandomRide())

    // Shuffle the safety message every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setSafetyMessage(getRandomSafetyMessage())
            setRide(getRandomRide())
        }, 8000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="app">
            <header className="app__header">
                <button className="app__logo" onClick={onNavigateHome}>
                    <span className="app__logo-icon">🍺</span>
                    JustOneLastDrink
                </button>
                <nav className="app__nav">
                    <button className="app__nav-link" onClick={onNavigateHome}>
                        Home
                    </button>
                    <button className="app__nav-link" onClick={onNavigateProfile}>
                        Profile
                    </button>
                    {onNavigateAdmin && (
                        <button className="app__nav-link" onClick={onNavigateAdmin}>
                            🔬 Admin
                        </button>
                    )}
                    {onNavigateLogs && (
                        <button className="app__nav-link" onClick={onNavigateLogs}>
                            📋 Logs
                        </button>
                    )}
                </nav>
            </header>

            <main className="app__main">
                {children}
            </main>

            <footer className="app__footer">
                <p>Drink responsibly. Know your limits. 🍺</p>
                <p style={{ marginTop: '4px' }}>
                    <a href="https://justonelastdrink.com">justonelastdrink.com</a> — Just one more. Sure.
                </p>
            </footer>

            {/* Get Home Safe — rotates services and messages */}
            <div className="get-home-safe">
                <a
                    href={ride.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-home-safe__btn"
                    key={safetyMessage}
                >
                    {safetyMessage}
                </a>
            </div>
        </div>
    )
}
