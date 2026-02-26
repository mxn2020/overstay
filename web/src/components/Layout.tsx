import { useState, useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConvexAuth } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from '../../convex/_generated/api'
import { getRandomRide, getRandomSafetyMessage } from '../lib/safeRide'
import { Menu, X } from 'lucide-react'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [safetyMessage, setSafetyMessage] = useState(getRandomSafetyMessage())
    const [ride, setRide] = useState(getRandomRide())
    const { isAuthenticated } = useConvexAuth()
    const { signOut } = useAuthActions()
    const me = useQuery(api.users.getMe)
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
                <Link to="/" className="app__logo">
                    <span className="app__logo-icon">🍺</span>
                    JustOneLastDrink
                </Link>

                <button
                    className="app__mobile-toggle"
                    onClick={() => setMobileMenuOpen(o => !o)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <nav className={`app__nav ${mobileMenuOpen ? 'app__nav--open' : ''}`}>
                    <Link to="/" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link to="/pricing" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                    <Link to="/help" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>Help</Link>
                    {isAuthenticated && me?.role === 'admin' && (
                        <>
                            <Link to="/admin" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>🔬 Admin</Link>
                            <Link to="/logs" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>📋 AI Logs</Link>
                            <Link to="/audit-logs" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>🔍 Audit</Link>
                        </>
                    )}
                    {isAuthenticated ? (
                        <>
                            <Link to="/settings" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
                            <button className="app__nav-link" onClick={() => { signOut(); navigate('/'); setMobileMenuOpen(false); }}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
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
