import { type ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode
    onNavigateHome: () => void
    onNavigateProfile: () => void
}

export default function Layout({ children, onNavigateHome, onNavigateProfile }: LayoutProps) {
    return (
        <div className="app">
            <header className="app__header">
                <button className="app__logo" onClick={onNavigateHome}>
                    <span className="app__logo-icon">🕐</span>
                    Overstay
                </button>
                <nav className="app__nav">
                    <button className="app__nav-link" onClick={onNavigateHome}>
                        Home
                    </button>
                    <button className="app__nav-link" onClick={onNavigateProfile}>
                        Profile
                    </button>
                </nav>
            </header>

            <main className="app__main">
                {children}
            </main>

            <footer className="app__footer">
                <p>Drink responsibly. Know your limits. 🕐</p>
                <p style={{ marginTop: '4px' }}>
                    <a href="https://overstay.app">overstay.app</a> — The nightlife oracle.
                </p>
            </footer>

            {/* Get Home Safe — always visible per safety guidelines */}
            <div className="get-home-safe">
                <a
                    href="https://www.uber.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-home-safe__btn"
                >
                    🏠 Get Home Safe
                </a>
            </div>
        </div>
    )
}
