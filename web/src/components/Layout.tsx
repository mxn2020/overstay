import { useState, useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConvexAuth } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from '../../convex/_generated/api'
import { getRandomRide, getRandomSafetyMessage } from '../lib/safeRide'

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
                <nav className="app__nav">
                    <Link to="/" className="app__nav-link">Home</Link>
                    <Link to="/pricing" className="app__nav-link">Pricing</Link>
                    <Link to="/help" className="app__nav-link">Help</Link>
                    {isAuthenticated && me?.role === 'admin' && (
                        <>
                            <Link to="/admin" className="app__nav-link">🔬 Admin</Link>
                            <Link to="/logs" className="app__nav-link">📋 Logs</Link>
                        </>
                    )}
                    {isAuthenticated ? (
                        <button className="app__nav-link" onClick={() => { signOut(); navigate('/'); }}>
                            Sign Out
                        </button>
                    ) : (
                        <Link to="/login" className="app__nav-link">Sign In</Link>
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
